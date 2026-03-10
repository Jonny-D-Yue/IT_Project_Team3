using EaterAI.Shared.DTOs.Chat;

namespace EaterAI.API.Services;

public interface IChatService
{
    Task<ChatResponse> SendMessageAsync(string userId, ChatRequest request);
    Task<List<ChatMessageDto>> GetHistoryAsync(string userId, string sessionId);
    Task<List<string>> GetSessionsAsync(string userId);
}
