using EaterAI.API.Data;
using EaterAI.API.Models;
using MongoDB.Driver;
using System.Text.Json;

namespace EaterAI.API.Data.Seed;

public static class SeedRunner
{
    public static async Task RunAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MongoDbContext>();

        var restaurantCount = await db.Restaurants.CountDocumentsAsync(FilterDefinition<Restaurant>.Empty);
        if (restaurantCount > 0) return;

        var json = await File.ReadAllTextAsync(
            Path.Combine(AppContext.BaseDirectory, "Data", "Seed", "seed_data.json"));

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // Insert restaurants and collect their generated IDs
        var restaurants = root.GetProperty("restaurants").EnumerateArray()
            .Select(r => new Restaurant
            {
                Name = r.GetProperty("name").GetString()!,
                Cuisine = r.GetProperty("cuisine").GetString()!,
                Location = r.GetProperty("location").GetString()!
            }).ToList();

        await db.Restaurants.InsertManyAsync(restaurants);

        // Insert menu items using restaurantIndex to resolve ID
        var menuItems = root.GetProperty("menuItems").EnumerateArray()
            .Select(m =>
            {
                var idx = m.GetProperty("restaurantIndex").GetInt32();
                return new MenuItem
                {
                    RestaurantId = restaurants[idx].Id,
                    Name = m.GetProperty("name").GetString()!,
                    Description = m.GetProperty("description").GetString()!,
                    Price = m.GetProperty("price").GetDecimal(),
                    Calories = m.GetProperty("calories").GetInt32(),
                    Protein = m.GetProperty("protein").GetDouble(),
                    Fat = m.GetProperty("fat").GetDouble(),
                    Carbs = m.GetProperty("carbs").GetDouble(),
                    Tags = m.GetProperty("tags").EnumerateArray().Select(t => t.GetString()!).ToList(),
                    Allergens = m.GetProperty("allergens").EnumerateArray().Select(a => a.GetString()!).ToList(),
                    IsVegan = m.GetProperty("isVegan").GetBoolean(),
                    IsSpicy = m.GetProperty("isSpicy").GetBoolean(),
                    Popularity = m.GetProperty("popularity").GetDouble()
                };
            }).ToList();

        await db.MenuItems.InsertManyAsync(menuItems);

        // Create indexes
        await db.Users.Indexes.CreateOneAsync(
            new CreateIndexModel<User>(
                Builders<User>.IndexKeys.Ascending(u => u.Email),
                new CreateIndexOptions { Unique = true }));

        await db.MenuItems.Indexes.CreateOneAsync(
            new CreateIndexModel<MenuItem>(
                Builders<MenuItem>.IndexKeys
                    .Ascending(m => m.RestaurantId)
                    .Ascending(m => m.IsVegan)
                    .Ascending(m => m.Calories)
                    .Ascending(m => m.Price)));

        await db.MealLogs.Indexes.CreateOneAsync(
            new CreateIndexModel<MealLog>(
                Builders<MealLog>.IndexKeys
                    .Ascending(l => l.UserId)
                    .Descending(l => l.Timestamp)));

        await db.Conversations.Indexes.CreateOneAsync(
            new CreateIndexModel<Conversation>(
                Builders<Conversation>.IndexKeys
                    .Ascending(c => c.UserId)
                    .Descending(c => c.UpdatedAt)));
    }
}
