using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EaterAI.API.Models;

public class FavoriteCollection
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public List<string> MenuItemIds { get; set; } = new();
}
