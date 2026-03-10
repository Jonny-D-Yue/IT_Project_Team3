using System.Text.Json;
using EaterAI.API.Configuration;
using EaterAI.API.Data;
using EaterAI.API.Models;
using EaterAI.Shared.DTOs.Manager;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using OpenAI;
using OpenAI.Chat;

namespace EaterAI.API.Services;

public class DishAnalysisService : IDishAnalysisService
{
    private readonly OpenAIClient _openAIClient;
    private readonly QwenSettings _qwen;
    private readonly MongoDbContext _db;

    private const string VisionPrompt =
        """
        Analyze this dish photo. Return ONLY valid JSON (no markdown, no code fence) with this exact schema:
        {
          "name": "dish name",
          "description": "one-sentence description",
          "calories": 0,
          "protein": 0.0,
          "fat": 0.0,
          "carbs": 0.0,
          "isVegan": false,
          "isSpicy": false,
          "dishType": "main course",
          "tags": ["main"],
          "allergens": [],
          "ingredients": [{"name":"ingredient","amount":"quantity"}],
          "method": "Step 1: ... Step 2: ... (detailed cooking instructions, ~150 words)"
        }
        For dishType use only one of: starter, snack, main course, dessert.
        For tags use only values from: appetizer, snack, main, dessert.
        Estimate nutritional values per standard serving.
        """;

    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public DishAnalysisService(OpenAIClient openAIClient, IOptions<QwenSettings> qwenOptions, MongoDbContext db)
    {
        _openAIClient = openAIClient;
        _qwen = qwenOptions.Value;
        _db = db;
    }

    public async Task<AnalyzeDishResponse> AnalyzeOnlyAsync(AnalyzeDishRequest req)
    {
        try
        {
            var imageBytes = Convert.FromBase64String(req.ImageBase64);
            var imageData  = BinaryData.FromBytes(imageBytes);

            var imagePart = ChatMessageContentPart.CreateImagePart(imageData, req.ImageMimeType);
            var textPart  = ChatMessageContentPart.CreateTextPart(VisionPrompt);
            var msg       = ChatMessage.CreateUserMessage(new[] { imagePart, textPart });

            var chatClient = _openAIClient.GetChatClient(_qwen.VisionModel);
            var completion = await chatClient.CompleteChatAsync(new[] { msg });

            var rawJson = completion.Value.Content[0].Text ?? string.Empty;
            rawJson = rawJson.Trim();
            if (rawJson.StartsWith("```"))
            {
                var start = rawJson.IndexOf('\n') + 1;
                var end   = rawJson.LastIndexOf("```");
                if (end > start) rawJson = rawJson[start..end].Trim();
            }

            var parsed = JsonSerializer.Deserialize<VisionResult>(rawJson, JsonOpts)
                         ?? throw new InvalidOperationException("Empty JSON from vision model.");

            return new AnalyzeDishResponse
            {
                Success     = true,
                Name        = parsed.Name,
                Description = parsed.Description,
                Calories    = parsed.Calories,
                Protein     = parsed.Protein,
                Fat         = parsed.Fat,
                Carbs       = parsed.Carbs,
                IsVegan     = parsed.IsVegan,
                IsSpicy     = parsed.IsSpicy,
                DishType    = parsed.DishType,
                Method      = parsed.Method,
                Tags        = parsed.Tags ?? new(),
                Allergens   = parsed.Allergens ?? new(),
                Ingredients = parsed.Ingredients?
                    .Select(i => new IngredientDto { Name = i.Name, Amount = i.Amount })
                    .ToList() ?? new()
            };
        }
        catch (Exception ex)
        {
            return new AnalyzeDishResponse { Success = false, Error = ex.Message };
        }
    }

    public async Task<string> SaveDishAsync(SaveDishRequest req)
    {
        var menuItem = new MenuItem
        {
            Id          = ObjectId.GenerateNewId().ToString(),
            RestaurantId = req.RestaurantId,
            Name        = req.Name,
            Description = req.Description,
            Price       = req.Price,
            Calories    = req.Calories,
            Protein     = req.Protein,
            Fat         = req.Fat,
            Carbs       = req.Carbs,
            IsVegan     = req.IsVegan,
            IsSpicy     = req.IsSpicy,
            DishType    = req.DishType,
            Method      = req.Method,
            Tags        = req.Tags,
            Allergens   = req.Allergens,
            Popularity  = 0.5,
            Ingredients = req.Ingredients
                .Select(i => new IngredientItem { Name = i.Name, Amount = i.Amount })
                .ToList()
        };

        await _db.MenuItems.InsertOneAsync(menuItem);
        return menuItem.Id;
    }

    private sealed class VisionResult
    {
        public string Name        { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int    Calories    { get; set; }
        public double Protein     { get; set; }
        public double Fat         { get; set; }
        public double Carbs       { get; set; }
        public bool   IsVegan     { get; set; }
        public bool   IsSpicy     { get; set; }
        public string DishType    { get; set; } = string.Empty;
        public string Method      { get; set; } = string.Empty;
        public List<string>?        Tags        { get; set; }
        public List<string>?        Allergens   { get; set; }
        public List<RawIngredient>? Ingredients { get; set; }
    }

    private sealed class RawIngredient
    {
        public string Name   { get; set; } = string.Empty;
        public string Amount { get; set; } = string.Empty;
    }
}
