using System.Text.RegularExpressions;
using EaterAI.API.Configuration;
using EaterAI.API.Data;
using EaterAI.API.Models;
using EaterAI.API.Services;
using EaterAI.Shared.DTOs.Agent;
using EaterAI.Shared.DTOs.Chat;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using OpenAI;
using OpenAI.Chat;
using System.Linq;

namespace EaterAI.API.Agent;

public class AgentOrchestrator
{
    private readonly OpenAIClient _openAIClient;
    private readonly QwenSettings _qwenSettings;
    private readonly MongoDbContext _db;
    private readonly ToolRegistry _toolRegistry;
    private readonly ToolDispatcher _toolDispatcher;
    private readonly GoalDetectorService _goalDetector;
    private readonly IImageGenerationService _imageGenService;
    private readonly IDishImageService _dishImageService;

    public AgentOrchestrator(
        OpenAIClient openAIClient,
        IOptions<QwenSettings> qwenOptions,
        MongoDbContext db,
        ToolRegistry toolRegistry,
        ToolDispatcher toolDispatcher,
        GoalDetectorService goalDetector,
        IImageGenerationService imageGenService,
        IDishImageService dishImageService)
    {
        _openAIClient = openAIClient;
        _qwenSettings = qwenOptions.Value;
        _db = db;
        _toolRegistry = toolRegistry;
        _toolDispatcher = toolDispatcher;
        _goalDetector = goalDetector;
        _imageGenService = imageGenService;
        _dishImageService = dishImageService;
    }

    public async Task<ChatResponse> RunAsync(string userId, string? sessionId, string userMessage, string language = "zh-CN")
    {
        // Step 1: Detect goal from user message
        var detectedGoal = await _goalDetector.DetectAsync(userMessage);

        // Step 2: Load user profile
        var user = await _db.Users
            .Find(Builders<User>.Filter.Eq(u => u.Id, userId))
            .FirstOrDefaultAsync();

        // Step 3: Load or create conversation
        Conversation conversation;
        if (!string.IsNullOrWhiteSpace(sessionId))
        {
            var existing = await _db.Conversations
                .Find(Builders<Conversation>.Filter.And(
                    Builders<Conversation>.Filter.Eq(c => c.Id, sessionId),
                    Builders<Conversation>.Filter.Eq(c => c.UserId, userId)))
                .FirstOrDefaultAsync();

            conversation = existing ?? CreateNewConversation(userId);
        }
        else
        {
            conversation = CreateNewConversation(userId);
        }

        // Step 4: Build system prompt
        var systemPrompt = BuildSystemPrompt(user, detectedGoal, language);

        // Step 5: Compose messages list for the model
        var messages = new List<ChatMessage>
        {
            ChatMessage.CreateSystemMessage(systemPrompt)
        };

        // Include last 20 conversation messages
        var historyMessages = conversation.Messages.TakeLast(20).ToList();
        foreach (var histMsg in historyMessages)
        {
            ChatMessage chatMsg = histMsg.Role switch
            {
                "assistant" => ChatMessage.CreateAssistantMessage(histMsg.Content),
                "tool" => ChatMessage.CreateToolMessage(histMsg.ToolCallId ?? string.Empty, histMsg.Content),
                _ => ChatMessage.CreateUserMessage(histMsg.Content)
            };
            messages.Add(chatMsg);
        }

        // Add the new user message
        messages.Add(ChatMessage.CreateUserMessage(userMessage));

        // Step 6: Agentic loop
        var chatClient = _openAIClient.GetChatClient(_qwenSettings.Model);
        var toolCallsMade = new List<string>();
        var finalReply = string.Empty;
        List<string>? lastDishNames = null;
        const int maxIterations = 10;

        for (var iteration = 0; iteration < maxIterations; iteration++)
        {
            var options = new ChatCompletionOptions
            {
                MaxOutputTokenCount = _qwenSettings.MaxTokens
            };
            foreach (var tool in _toolRegistry.GetAllTools())
                options.Tools.Add(tool);

            var completion = await chatClient.CompleteChatAsync(messages, options);
            var completionValue = completion.Value;

            if (completionValue.FinishReason == ChatFinishReason.ToolCalls)
            {
                // Add the assistant message with tool calls
                messages.Add(ChatMessage.CreateAssistantMessage(completionValue));

                // Dispatch each tool call and add results
                foreach (var toolCall in completionValue.ToolCalls)
                {
                    var toolName = toolCall.FunctionName;
                    toolCallsMade.Add(toolName);

                    var toolResult = await _toolDispatcher.DispatchAsync(
                        toolName,
                        toolCall.FunctionArguments,
                        userId);

                    // Track last set of dish names returned by any dish tool
                    if (toolResult.DishNames is { Count: > 0 })
                        lastDishNames = toolResult.DishNames;

                    messages.Add(ChatMessage.CreateToolMessage(toolCall.Id, toolResult.Json));
                }

                continue;
            }

            // FinishReason.Stop or any other terminal reason
            finalReply = completionValue.Content.Count > 0
                ? completionValue.Content[0].Text
                : string.Empty;
            break;
        }

        // Step 7: Generate images for recommended dishes (after loop)
        string? imageUrl = null;
        var dishItems = new List<DishItemDto>();

        if (lastDishNames is { Count: > 0 })
        {
            // Extract dish names the AI actually recommended (bold **name** in reply)
            var boldMatches = Regex.Matches(finalReply, @"\*\*([^*]+)\*\*");
            var recommendedNames = boldMatches
                .Select(m => m.Groups[1].Value.Trim())
                .Where(name => lastDishNames.Contains(name, StringComparer.OrdinalIgnoreCase))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            // Fall back to top lastDishNames if nothing matched
            var dishNamesForImages = recommendedNames.Count > 0
                ? recommendedNames
                : lastDishNames.Take(6).ToList();

            // Generate combined artistic image only for the recommended dishes
            imageUrl = await _imageGenService.GenerateAsync(dishNamesForImages);

            // Look up individual dish images for the recommended dishes
            var dishDocs = await _db.MenuItems
                .Find(Builders<MenuItem>.Filter.In(m => m.Name, dishNamesForImages))
                .ToListAsync();

            // Look up restaurant names for the dish docs
            var restaurantIds = dishDocs.Select(d => d.RestaurantId).Distinct().ToList();
            var restaurants = await _db.Restaurants
                .Find(Builders<Restaurant>.Filter.In(r => r.Id, restaurantIds))
                .ToListAsync();
            var restaurantMap = restaurants.ToDictionary(r => r.Id, r => r.Name);

            // Preserve the recommended order
            foreach (var name in dishNamesForImages)
            {
                var doc = dishDocs.FirstOrDefault(d =>
                    string.Equals(d.Name, name, StringComparison.OrdinalIgnoreCase));
                if (doc is null) continue;
                var url = await _dishImageService.EnsureDishImageAsync(doc);
                restaurantMap.TryGetValue(doc.RestaurantId, out var restaurantName);
                dishItems.Add(new DishItemDto
                {
                    Id = doc.Id,
                    Name = doc.Name,
                    RestaurantName = restaurantName ?? string.Empty,
                    ImageUrl = url
                });
            }
        }

        // Step 8: Persist conversation
        var userConvMessage = new ConversationMessage
        {
            Role = "user",
            Content = userMessage,
            Timestamp = DateTime.UtcNow
        };
        var assistantConvMessage = new ConversationMessage
        {
            Role = "assistant",
            Content = finalReply,
            Timestamp = DateTime.UtcNow
        };

        conversation.Messages.Add(userConvMessage);
        conversation.Messages.Add(assistantConvMessage);
        conversation.UpdatedAt = DateTime.UtcNow;

        var upsertFilter = Builders<Conversation>.Filter.Eq(c => c.Id, conversation.Id);
        var upsertOptions = new ReplaceOptions { IsUpsert = true };
        await _db.Conversations.ReplaceOneAsync(upsertFilter, conversation, upsertOptions);

        // Step 9: Return response
        return new ChatResponse
        {
            SessionId = conversation.Id,
            Reply = finalReply,
            ToolCallsMade = toolCallsMade,
            Timestamp = DateTime.UtcNow,
            DetectedGoal = detectedGoal,
            RecommendedDishNames = lastDishNames ?? new List<string>(),
            ImageUrl = imageUrl,
            DishItems = dishItems
        };
    }

    private static Conversation CreateNewConversation(string userId) => new()
    {
        Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
        UserId = userId,
        Messages = new List<ConversationMessage>(),
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    private static string BuildSystemPrompt(User? user, DetectedGoalDto detectedGoal, string language = "zh-CN")
    {
        var dietInfo = user is not null
            ? $"Diet type: {user.Profile.DietType}. " +
              $"Allergies: {(user.Profile.Allergies.Count > 0 ? string.Join(", ", user.Profile.Allergies) : "none")}. " +
              $"Goals: {(user.Profile.Goals.Count > 0 ? string.Join(", ", user.Profile.Goals) : "none")}. " +
              $"Budget: {user.Profile.Budget:C}."
            : "No user profile available.";

        var goalInfo =
            $"isLowCalorie={detectedGoal.IsLowCalorie}, " +
            $"isLowSodium={detectedGoal.IsLowSodium}, " +
            $"isHighProtein={detectedGoal.IsHighProtein}, " +
            $"isVegan={detectedGoal.IsVegan}, " +
            $"isSpicy={detectedGoal.IsSpicy}, " +
            $"maxBudget={detectedGoal.MaxBudget?.ToString() ?? "null"}, " +
            $"allergens=[{string.Join(", ", detectedGoal.Allergens)}].";

        var languageInstruction = language == "en-US"
            ? "You MUST respond ONLY in English. Do NOT use any Chinese characters or Chinese language under any circumstances. Every single word must be in English."
            : "你必须只用中文回复，不得使用任何英文词汇。";

        return $"""
                You are EaterAI, a helpful dietary and restaurant recommendation assistant.
                Always be concise, friendly, and use the available tools to fetch real menu data before making recommendations.
                When recommending dishes, always list the recommended dish names clearly (e.g., "I recommend: **Garden Buddha Bowl**, **Spicy Tofu Ramen**").
                {languageInstruction}

                [User Profile]
                {dietInfo}

                [Detected session intent]
                {detectedGoal.RawGoalSummary}
                {goalInfo}

                [MEAL SET RULE]
                Unless the user specifically asks to add or remove individual dishes, always recommend a complete 套餐 (meal set) with exactly 4 courses:
                - Appetizer: one lighter dish to begin
                - Snack: one small side dish
                - Main Course: one hearty main dish
                - Dessert: one sweet ending
                Use filter_menu with the "course" parameter (appetizer / snack / main / dessert) to fetch candidates for each course separately, then pick the best match for the user's needs.
                Present each course clearly labeled on its own line. Bold each dish name as **name**.
                """;
    }
}
