using EaterAI.Shared.DTOs.Chat;

namespace EaterAI.MAUI.Services;

public interface IChatApiService
{
    Task<ChatResponse?> SendMessageAsync(ChatRequest request);
    Task<List<ChatMessageDto>> GetHistoryAsync(string sessionId);
    Task<List<string>> GetSessionsAsync();
}

public class ChatApiService : ApiService, IChatApiService
{
    public ChatApiService(IHttpClientFactory factory, ISecureTokenStorage tokenStorage)
        : base(factory, tokenStorage)
    {
    }

    public Task<ChatResponse?> SendMessageAsync(ChatRequest request)
        => PostAsync<ChatRequest, ChatResponse>("/api/chat/send", request);

    public async Task<List<ChatMessageDto>> GetHistoryAsync(string sessionId)
        => await GetAsync<List<ChatMessageDto>>($"/api/chat/history/{sessionId}") ?? new List<ChatMessageDto>();

    public async Task<List<string>> GetSessionsAsync()
        => await GetAsync<List<string>>("/api/chat/sessions") ?? new List<string>();
}
