using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EaterAI.API.Models;

public class Restaurant
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public string Cuisine { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
}
