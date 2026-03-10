using EaterAI.API.Data;
using EaterAI.API.Models;
using EaterAI.Shared.DTOs.Manager;
using EaterAI.Shared.DTOs.Menu;
using EaterAI.Shared.Enums;
using MongoDB.Driver;

namespace EaterAI.API.Services;

public class MenuService : IMenuService
{
    private readonly MongoDbContext _db;

    public MenuService(MongoDbContext db)
    {
        _db = db;
    }

    public async Task<List<RestaurantDto>> GetRestaurantsAsync()
    {
        var restaurants = await _db.Restaurants.Find(Builders<Restaurant>.Filter.Empty).ToListAsync();
        return restaurants.Select(r => new RestaurantDto
        {
            Id = r.Id,
            Name = r.Name,
            Cuisine = r.Cuisine,
            Location = r.Location,
            LogoUrl = r.LogoUrl
        }).ToList();
    }

    public async Task<List<MenuItemDto>> GetMenuItemsAsync(string restaurantId)
    {
        var filter = Builders<MenuItem>.Filter.Eq(m => m.RestaurantId, restaurantId);
        var items = await _db.MenuItems.Find(filter).ToListAsync();
        return items.Select(i => MapToDto(i)).ToList();
    }

    public async Task<List<MenuItemDto>> GetAllMenuItemsAsync()
    {
        var restaurants = await _db.Restaurants.Find(Builders<Restaurant>.Filter.Empty).ToListAsync();
        var nameMap = restaurants.ToDictionary(r => r.Id, r => r.Name);
        var items = await _db.MenuItems.Find(Builders<MenuItem>.Filter.Empty).ToListAsync();
        return items.Select(i => MapToDto(i, nameMap.GetValueOrDefault(i.RestaurantId))).ToList();
    }

    public async Task<List<MenuItemDto>> FilterMenuItemsAsync(MenuFilterRequest request)
    {
        var builder = Builders<MenuItem>.Filter;
        var filters = new List<FilterDefinition<MenuItem>>();

        if (!string.IsNullOrWhiteSpace(request.RestaurantId))
            filters.Add(builder.Eq(m => m.RestaurantId, request.RestaurantId));

        if (request.IsVegan.HasValue)
            filters.Add(builder.Eq(m => m.IsVegan, request.IsVegan.Value));

        if (request.IsSpicy.HasValue)
            filters.Add(builder.Eq(m => m.IsSpicy, request.IsSpicy.Value));

        if (request.MaxCalories.HasValue)
            filters.Add(builder.Lte(m => m.Calories, request.MaxCalories.Value));

        if (request.MinProtein.HasValue)
            filters.Add(builder.Gte(m => m.Protein, request.MinProtein.Value));

        if (request.MaxPrice.HasValue)
            filters.Add(builder.Lte(m => m.Price, request.MaxPrice.Value));

        if (request.ExcludeAllergens is { Count: > 0 })
            filters.Add(builder.Not(builder.AnyIn(m => m.Allergens, request.ExcludeAllergens)));

        if (request.Tags is { Count: > 0 })
            filters.Add(builder.AnyIn(m => m.Tags, request.Tags));

        var combinedFilter = filters.Count > 0
            ? builder.And(filters)
            : builder.Empty;

        var sortDefinition = request.SortBy switch
        {
            SortBy.Price => Builders<MenuItem>.Sort.Ascending(m => m.Price),
            SortBy.Calories => Builders<MenuItem>.Sort.Ascending(m => m.Calories),
            SortBy.Protein => Builders<MenuItem>.Sort.Descending(m => m.Protein),
            _ => Builders<MenuItem>.Sort.Descending(m => m.Popularity)
        };

        var items = await _db.MenuItems
            .Find(combinedFilter)
            .Sort(sortDefinition)
            .ToListAsync();

        return items.Select(i => MapToDto(i)).ToList();
    }

    public async Task<MenuItem?> GetMenuItemByIdAsync(string id)
    {
        var filter = Builders<MenuItem>.Filter.Eq(m => m.Id, id);
        return await _db.MenuItems.Find(filter).FirstOrDefaultAsync();
    }

    public async Task<MenuItemDto?> GetMenuItemDtoByIdAsync(string id)
    {
        var item = await GetMenuItemByIdAsync(id);
        return item is null ? null : MapToDto(item);
    }

    public async Task TriggerLogoGenerationAsync(IDishImageService dishImageService)
    {
        var restaurants = await _db.Restaurants
            .Find(Builders<Restaurant>.Filter.Or(
                Builders<Restaurant>.Filter.Eq(r => r.LogoUrl, null),
                Builders<Restaurant>.Filter.Eq(r => r.LogoUrl, string.Empty)))
            .ToListAsync();

        foreach (var restaurant in restaurants)
            await dishImageService.EnsureRestaurantLogoAsync(restaurant);
    }

    public async Task TriggerDishImageGenerationAsync(string restaurantId, IDishImageService dishImageService)
    {
        var filter = Builders<MenuItem>.Filter.And(
            Builders<MenuItem>.Filter.Eq(m => m.RestaurantId, restaurantId),
            Builders<MenuItem>.Filter.Or(
                Builders<MenuItem>.Filter.Eq(m => m.ImageUrl, null),
                Builders<MenuItem>.Filter.Eq(m => m.ImageUrl, string.Empty)));

        var items = await _db.MenuItems.Find(filter).ToListAsync();

        foreach (var item in items)
            await dishImageService.EnsureDishImageAsync(item);
    }

    private static MenuItemDto MapToDto(MenuItem item, string? restaurantName = null) => new()
    {
        Id = item.Id,
        RestaurantId = item.RestaurantId,
        RestaurantName = restaurantName,
        Name = item.Name,
        Description = item.Description,
        Price = item.Price,
        Calories = item.Calories,
        Protein = item.Protein,
        Fat = item.Fat,
        Carbs = item.Carbs,
        Tags = item.Tags,
        Allergens = item.Allergens,
        IsVegan = item.IsVegan,
        IsSpicy = item.IsSpicy,
        Popularity = item.Popularity,
        ImageUrl = item.ImageUrl,
        DishType = item.DishType,
        Method = item.Method,
        Ingredients = item.Ingredients?
            .Select(i => new IngredientDto { Name = i.Name, Amount = i.Amount })
            .ToList()
    };
}
