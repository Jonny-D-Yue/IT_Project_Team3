using System.Text.Json;
using EaterAI.API.Data;
using EaterAI.API.Models;
using EaterAI.API.Services;
using EaterAI.Shared.DTOs.Menu;
using MongoDB.Driver;

namespace EaterAI.API.Agent;

public record ToolResult(string Json, List<string>? DishNames = null);

public class ToolDispatcher
{
    private readonly IMenuService _menuService;
    private readonly IMealLogService _mealLogService;
    private readonly MongoDbContext _db;

    public ToolDispatcher(IMenuService menuService, IMealLogService mealLogService, MongoDbContext db)
    {
        _menuService = menuService;
        _mealLogService = mealLogService;
        _db = db;
    }

    public async Task<ToolResult> DispatchAsync(string toolName, BinaryData arguments, string userId)
    {
        using var doc = JsonDocument.Parse(arguments.ToString());
        var args = doc.RootElement;

        return toolName switch
        {
            "fetch_menu" => await HandleFetchMenuAsync(args),
            "filter_menu" => await HandleFilterMenuAsync(args),
            "rank_dishes" => await HandleRankDishesAsync(args),
            "build_combo" => await HandleBuildComboAsync(args),
            "get_user_stats" => new ToolResult(await HandleGetUserStatsAsync(userId)),
            "log_meal" => new ToolResult(await HandleLogMealAsync(args, userId)),
            _ => new ToolResult("""{"error": "Unknown tool"}""")
        };
    }

    private async Task<ToolResult> HandleFetchMenuAsync(JsonElement args)
    {
        var restaurantId = args.GetProperty("restaurant_id").GetString() ?? string.Empty;
        var items = await _menuService.GetMenuItemsAsync(restaurantId);
        var dishNames = items.Select(i => i.Name).ToList();
        return new ToolResult(JsonSerializer.Serialize(items), dishNames);
    }

    private async Task<ToolResult> HandleFilterMenuAsync(JsonElement args)
    {
        var request = new MenuFilterRequest();

        if (args.TryGetProperty("restaurant_id", out var rid) && rid.ValueKind == JsonValueKind.String)
            request.RestaurantId = rid.GetString();

        if (args.TryGetProperty("is_vegan", out var isVegan) && isVegan.ValueKind == JsonValueKind.True || isVegan.ValueKind == JsonValueKind.False)
            request.IsVegan = isVegan.GetBoolean();

        if (args.TryGetProperty("is_spicy", out var isSpicy) && (isSpicy.ValueKind == JsonValueKind.True || isSpicy.ValueKind == JsonValueKind.False))
            request.IsSpicy = isSpicy.GetBoolean();

        if (args.TryGetProperty("max_calories", out var maxCal) && maxCal.ValueKind == JsonValueKind.Number)
            request.MaxCalories = maxCal.GetInt32();

        if (args.TryGetProperty("min_protein", out var minProt) && minProt.ValueKind == JsonValueKind.Number)
            request.MinProtein = minProt.GetDouble();

        if (args.TryGetProperty("max_price", out var maxPrice) && maxPrice.ValueKind == JsonValueKind.Number)
            request.MaxPrice = maxPrice.GetDecimal();

        if (args.TryGetProperty("exclude_allergens", out var allergens) && allergens.ValueKind == JsonValueKind.Array)
            request.ExcludeAllergens = allergens.EnumerateArray()
                .Where(e => e.ValueKind == JsonValueKind.String)
                .Select(e => e.GetString()!)
                .ToList();

        if (args.TryGetProperty("tags", out var tags) && tags.ValueKind == JsonValueKind.Array)
            request.Tags = tags.EnumerateArray()
                .Where(e => e.ValueKind == JsonValueKind.String)
                .Select(e => e.GetString()!)
                .ToList();

        if (args.TryGetProperty("course", out var courseEl) && courseEl.ValueKind == JsonValueKind.String)
        {
            switch (courseEl.GetString())
            {
                case "appetizer":
                    request.Tags ??= new List<string>();
                    if (!request.Tags.Contains("appetizer")) request.Tags.Add("appetizer");
                    break;
                case "snack":
                    request.MaxCalories ??= 299;
                    break;
                case "main":
                    request.MinProtein ??= 15.0;
                    break;
                case "dessert":
                    request.Tags ??= new List<string>();
                    if (!request.Tags.Contains("dessert")) request.Tags.Add("dessert");
                    break;
            }
        }

        var items = await _menuService.FilterMenuItemsAsync(request);
        var dishNames = items.Select(i => i.Name).ToList();
        return new ToolResult(JsonSerializer.Serialize(items), dishNames);
    }

    private async Task<ToolResult> HandleRankDishesAsync(JsonElement args)
    {
        var dishIds = args.GetProperty("dish_ids").EnumerateArray()
            .Where(e => e.ValueKind == JsonValueKind.String)
            .Select(e => e.GetString()!)
            .ToList();

        var goal = args.GetProperty("goal").GetString() ?? "popularity_high";

        var filter = Builders<MenuItem>.Filter.In(m => m.Id, dishIds);
        var items = await _db.MenuItems.Find(filter).ToListAsync();

        var sorted = goal switch
        {
            "calories_low" => items.OrderBy(m => m.Calories).ToList(),
            "protein_high" => items.OrderByDescending(m => m.Protein).ToList(),
            "price_low" => items.OrderBy(m => m.Price).ToList(),
            "popularity_high" => items.OrderByDescending(m => m.Popularity).ToList(),
            _ => items.OrderByDescending(m => m.Popularity).ToList()
        };

        var dtos = sorted.Select(MapToDto).ToList();
        var dishNames = sorted.Select(m => m.Name).ToList();
        return new ToolResult(JsonSerializer.Serialize(dtos), dishNames);
    }

    private async Task<ToolResult> HandleBuildComboAsync(JsonElement args)
    {
        var restaurantId = args.GetProperty("restaurant_id").GetString() ?? string.Empty;
        var budget = args.GetProperty("budget").GetDecimal();
        var goal = args.GetProperty("goal").GetString() ?? "balanced";

        var filter = Builders<MenuItem>.Filter.Eq(m => m.RestaurantId, restaurantId);
        var allItems = await _db.MenuItems.Find(filter).ToListAsync();

        // Sort candidates by goal priority
        var candidates = goal switch
        {
            "muscle_gain" => allItems.OrderByDescending(m => m.Protein).ThenBy(m => m.Price).ToList(),
            "weight_loss" => allItems.OrderBy(m => m.Calories).ThenBy(m => m.Price).ToList(),
            _ => allItems.OrderByDescending(m => m.Protein / (double)(m.Calories + 1)).ThenBy(m => m.Price).ToList()
        };

        // Greedy selection: pick highest-priority items that fit within budget
        var combo = new List<MenuItem>();
        var spent = 0m;

        foreach (var item in candidates)
        {
            if (spent + item.Price <= budget)
            {
                combo.Add(item);
                spent += item.Price;
            }
        }

        var result = new
        {
            goal,
            budget,
            totalPrice = spent,
            totalCalories = combo.Sum(m => m.Calories),
            totalProtein = combo.Sum(m => m.Protein),
            items = combo.Select(MapToDto)
        };

        var dishNames = combo.Select(m => m.Name).ToList();
        return new ToolResult(JsonSerializer.Serialize(result), dishNames);
    }

    private async Task<string> HandleGetUserStatsAsync(string userId)
    {
        var stats = await _mealLogService.GetWeeklyStatsAsync(userId);
        return JsonSerializer.Serialize(stats);
    }

    private async Task<string> HandleLogMealAsync(JsonElement args, string userId)
    {
        var dishId = args.GetProperty("dish_id").GetString() ?? string.Empty;
        await _mealLogService.LogMealAsync(userId, dishId);
        return """{"success": true}""";
    }

    private static object MapToDto(MenuItem item) => new
    {
        id = item.Id,
        restaurantId = item.RestaurantId,
        name = item.Name,
        description = item.Description,
        price = item.Price,
        calories = item.Calories,
        protein = item.Protein,
        fat = item.Fat,
        carbs = item.Carbs,
        tags = item.Tags,
        allergens = item.Allergens,
        isVegan = item.IsVegan,
        isSpicy = item.IsSpicy,
        popularity = item.Popularity
    };
}
