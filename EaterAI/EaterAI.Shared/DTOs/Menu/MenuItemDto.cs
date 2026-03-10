using EaterAI.Shared.DTOs.Manager;

namespace EaterAI.Shared.DTOs.Menu;

public class MenuItemDto
{
    public string Id { get; set; } = string.Empty;
    public string RestaurantId { get; set; } = string.Empty;
    public string? RestaurantName { get; set; }
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
    public string? DishType { get; set; }
    public List<IngredientDto>? Ingredients { get; set; }
    public string? Method { get; set; }
}
