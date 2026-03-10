using EaterAI.API.Agent;
using EaterAI.API.Data;
using EaterAI.API.Models;
using EaterAI.Shared.DTOs.Chat;
using MongoDB.Driver;

namespace EaterAI.API.Services;

public class ChatService : IChatService
{
    private readonly AgentOrchestrator _agentOrchestrator;
    private readonly MongoDbContext _db;

    public ChatService(AgentOrchestrator agentOrchestrator, MongoDbContext db)
    {
        _agentOrchestrator = agentOrchestrator;
        _db = db;
    }

    public async Task<ChatResponse> SendMessageAsync(string userId, ChatRequest request)
    {
        return await _agentOrchestrator.RunAsync(userId, request.SessionId, request.Message, request.Language);
    }

    public async Task<List<ChatMessageDto>> GetHistoryAsync(string userId, string sessionId)
    {
        var filter = Builders<Conversation>.Filter.And(
            Builders<Conversation>.Filter.Eq(c => c.UserId, userId),
            Builders<Conversation>.Filter.Eq(c => c.Id, sessionId)
        );

        var conversation = await _db.Conversations.Find(filter).FirstOrDefaultAsync();
        if (conversation is null)
            return new List<ChatMessageDto>();

        return conversation.Messages
            .Where(m => m.Role is "user" or "assistant")
            .Select(m => new ChatMessageDto
            {
                Role = m.Role,
                Content = m.Content,
                Timestamp = m.Timestamp
            })
            .ToList();
    }

    public async Task<List<string>> GetSessionsAsync(string userId)
    {
        var filter = Builders<Conversation>.Filter.Eq(c => c.UserId, userId);
        var conversations = await _db.Conversations
            .Find(filter)
            .Sort(Builders<Conversation>.Sort.Descending(c => c.UpdatedAt))
            .ToListAsync();

        return conversations.Select(c => c.Id).ToList();
    }
}
