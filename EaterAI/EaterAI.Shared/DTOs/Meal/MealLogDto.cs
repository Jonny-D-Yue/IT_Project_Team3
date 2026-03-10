namespace EaterAI.Shared.DTOs.Meal;

public class MealLogDto
{
    public string Id { get; set; } = string.Empty;
    public string MenuItemId { get; set; } = string.Empty;
    public string MenuItemName { get; set; } = string.Empty;
    public int Calories { get; set; }
    public DateTime Timestamp { get; set; }
}
