using MongoDB.Bson.Serialization.Attributes;

namespace EaterAI.API.Models;

[BsonIgnoreExtraElements]
public class IngredientItem
{
    [BsonElement("name")]
    public string Name   { get; set; } = string.Empty;

    [BsonElement("amount")]
    public string Amount { get; set; } = string.Empty;
}
