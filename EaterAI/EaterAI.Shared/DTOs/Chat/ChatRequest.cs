namespace EaterAI.Shared.DTOs.Chat;

public class ChatRequest
{
    public string? SessionId { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Language { get; set; } = "zh-CN";
}
