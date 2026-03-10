using EaterAI.API.Configuration;
using EaterAI.API.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace EaterAI.API.Data;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IOptions<MongoDbSettings> settings)
    {
        var client = new MongoClient(settings.Value.ConnectionString);
        _database = client.GetDatabase(settings.Value.DatabaseName);
    }

    public IMongoCollection<User> Users => _database.GetCollection<User>("users");
    public IMongoCollection<Restaurant> Restaurants => _database.GetCollection<Restaurant>("restaurants");
    public IMongoCollection<MenuItem> MenuItems => _database.GetCollection<MenuItem>("menu_items");
    public IMongoCollection<Conversation> Conversations => _database.GetCollection<Conversation>("conversations");
    public IMongoCollection<MealLog> MealLogs => _database.GetCollection<MealLog>("meal_logs");
    public IMongoCollection<FavoriteCollection> FavoriteCollections => _database.GetCollection<FavoriteCollection>("favorite_collections");
}
