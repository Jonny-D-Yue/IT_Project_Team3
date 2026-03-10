namespace EaterAI.Shared.DTOs.Chat;

public class DishItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string RestaurantName { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
}
