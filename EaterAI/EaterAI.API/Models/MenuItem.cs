using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EaterAI.API.Models;

public class MenuItem
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string RestaurantId { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Calories { get; set; }
    public double Protein { get; set; }
    public double Fat { get; set; }
    public double Carbs { get; set; }
    public List<string> Tags { get; set; } = new();
    public List<string> Allergens { get; set; } = new();
    public bool IsVegan { get; set; }
    public bool IsSpicy { get; set; }
    public double Popularity { get; set; }
    public string? ImageUrl { get; set; }

    /// <summary>starter | snack | main course | dessert</summary>
    public string DishType { get; set; } = string.Empty;

    [MongoDB.Bson.Serialization.Attributes.BsonIgnoreIfNull]
    public List<IngredientItem>? Ingredients { get; set; }

    [BsonIgnoreIfNull]
    public string? Method { get; set; }
}
