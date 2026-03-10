using EaterAI.API.Data;
using EaterAI.API.Models;
using EaterAI.Shared.DTOs.Favorites;
using EaterAI.Shared.DTOs.Menu;
using MongoDB.Driver;

namespace EaterAI.API.Services;

public class FavoriteService : IFavoriteService
{
    private readonly MongoDbContext _db;

    public FavoriteService(MongoDbContext db)
    {
        _db = db;
    }

    public async Task<List<FavoriteCollectionDto>> GetCollectionsAsync(string userId)
    {
        var filter = Builders<FavoriteCollection>.Filter.Eq(c => c.UserId, userId);
        var collections = await _db.FavoriteCollections.Find(filter).ToListAsync();

        var result = new List<FavoriteCollectionDto>();
        foreach (var collection in collections)
        {
            var menuItems = new List<MenuItemDto>();
            if (collection.MenuItemIds.Count > 0)
            {
                var itemFilter = Builders<MenuItem>.Filter.In(m => m.Id, collection.MenuItemIds);
                var items = await _db.MenuItems.Find(itemFilter).ToListAsync();
                menuItems = items.Select(MapItemToDto).ToList();
            }

            result.Add(new FavoriteCollectionDto
            {
                Id = collection.Id,
                Name = collection.Name,
                MenuItemIds = collection.MenuItemIds,
                MenuItems = menuItems
            });
        }

        return result;
    }

    public async Task<FavoriteCollectionDto> CreateCollectionAsync(string userId, string name)
    {
        var collection = new FavoriteCollection
        {
            UserId = userId,
            Name = name,
            MenuItemIds = new List<string>()
        };

        await _db.FavoriteCollections.InsertOneAsync(collection);

        return new FavoriteCollectionDto
        {
            Id = collection.Id,
            Name = collection.Name,
            MenuItemIds = collection.MenuItemIds,
            MenuItems = new List<MenuItemDto>()
        };
    }

    public async Task AddItemAsync(string userId, string collectionId, string menuItemId)
    {
        var filter = Builders<FavoriteCollection>.Filter.And(
            Builders<FavoriteCollection>.Filter.Eq(c => c.Id, collectionId),
            Builders<FavoriteCollection>.Filter.Eq(c => c.UserId, userId)
        );

        var update = Builders<FavoriteCollection>.Update.AddToSet(c => c.MenuItemIds, menuItemId);

        var result = await _db.FavoriteCollections.UpdateOneAsync(filter, update);
        if (result.MatchedCount == 0)
            throw new KeyNotFoundException($"Collection '{collectionId}' not found for this user.");
    }

    public async Task RemoveItemAsync(string userId, string collectionId, string menuItemId)
    {
        var filter = Builders<FavoriteCollection>.Filter.And(
            Builders<FavoriteCollection>.Filter.Eq(c => c.Id, collectionId),
            Builders<FavoriteCollection>.Filter.Eq(c => c.UserId, userId)
        );

        var update = Builders<FavoriteCollection>.Update.Pull(c => c.MenuItemIds, menuItemId);

        var result = await _db.FavoriteCollections.UpdateOneAsync(filter, update);
        if (result.MatchedCount == 0)
            throw new KeyNotFoundException($"Collection '{collectionId}' not found for this user.");
    }

    private static MenuItemDto MapItemToDto(MenuItem item) => new()
    {
        Id = item.Id,
        RestaurantId = item.RestaurantId,
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
        Popularity = item.Popularity
    };
}
