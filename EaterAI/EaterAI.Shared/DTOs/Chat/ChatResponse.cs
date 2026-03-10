using EaterAI.Shared.DTOs.Agent;

namespace EaterAI.Shared.DTOs.Chat;

public class ChatResponse
{
    public string SessionId { get; set; } = string.Empty;
    public string Reply { get; set; } = string.Empty;
    public List<string> ToolCallsMade { get; set; } = new();
    public DateTime Timestamp { get; set; }
    public DetectedGoalDto? DetectedGoal { get; set; }
    public List<string> RecommendedDishNames { get; set; } = new();
    public string? ImageUrl { get; set; }
    public List<DishItemDto> DishItems { get; set; } = new();
}
