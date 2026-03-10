using EaterAI.Shared.Enums;

namespace EaterAI.Shared.DTOs.Menu;

public class MenuFilterRequest
{
    public string? RestaurantId { get; set; }
    public bool? IsVegan { get; set; }
    public bool? IsSpicy { get; set; }
    public int? MaxCalories { get; set; }
    public double? MinProtein { get; set; }
    public decimal? MaxPrice { get; set; }
    public List<string> ExcludeAllergens { get; set; } = new();
    public List<string> Tags { get; set; } = new();
    public SortBy SortBy { get; set; } = SortBy.Popularity;
}
