using System.Text.Json;
using EaterAI.API.Configuration;
using EaterAI.Shared.DTOs.Agent;
using Microsoft.Extensions.Options;
using OpenAI;
using OpenAI.Chat;

namespace EaterAI.API.Agent;

public class GoalDetectorService
{
    private readonly OpenAIClient _openAIClient;
    private readonly QwenSettings _qwenSettings;

    public GoalDetectorService(OpenAIClient openAIClient, IOptions<QwenSettings> qwenOptions)
    {
        _openAIClient = openAIClient;
        _qwenSettings = qwenOptions.Value;
    }

    public async Task<DetectedGoalDto> DetectAsync(string userMessage)
    {
        try
        {
            var chatClient = _openAIClient.GetChatClient(_qwenSettings.Model);

            var systemPrompt =
                "You are a dietary intent extractor. Extract dietary goals from the user's message as JSON only. " +
                "Return ONLY valid JSON with these fields: " +
                "isLowCalorie (bool), isLowSodium (bool), isHighProtein (bool), isVegan (bool), isSpicy (bool), " +
                "maxBudget (number or null), allergens (string array), rawGoalSummary (string). " +
                "If a field is not mentioned, use false or null.";

            var messages = new List<ChatMessage>
            {
                ChatMessage.CreateSystemMessage(systemPrompt),
                ChatMessage.CreateUserMessage(userMessage)
            };

            var completion = await chatClient.CompleteChatAsync(messages);
            var content = completion.Value.Content[0].Text;

            // Strip markdown code fences if present
            var json = content.Trim();
            if (json.StartsWith("```"))
            {
                var firstNewline = json.IndexOf('\n');
                if (firstNewline >= 0)
                    json = json[(firstNewline + 1)..];
                var lastFence = json.LastIndexOf("```");
                if (lastFence >= 0)
                    json = json[..lastFence];
                json = json.Trim();
            }

            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var result = JsonSerializer.Deserialize<DetectedGoalDto>(json, options);
            return result ?? new DetectedGoalDto();
        }
        catch
        {
            return new DetectedGoalDto();
        }
    }
}
