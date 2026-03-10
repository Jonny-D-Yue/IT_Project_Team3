namespace EaterAI.Shared.DTOs.Chat;

public class ChatMessageDto
{
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string? ImageUrl { get; set; }
    public List<DishItemDto>? DishItems { get; set; }
}
