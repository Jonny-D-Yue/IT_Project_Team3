namespace EaterAI.Shared.DTOs.Menu;

public class RestaurantDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Cuisine { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
}
