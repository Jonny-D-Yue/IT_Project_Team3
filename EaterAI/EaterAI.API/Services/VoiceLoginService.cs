using System.Net.Http.Json;
using System.Text.Json;
using EaterAI.API.Data;
using EaterAI.API.Models;
using EaterAI.Shared.DTOs.Auth;
using MongoDB.Driver;

namespace EaterAI.API.Services;

public class VoiceLoginService : IVoiceLoginService
{
    private readonly HttpClient _speechBrain;
    private readonly MongoDbContext _db;
    private readonly double _threshold;

    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public VoiceLoginService(IHttpClientFactory factory, MongoDbContext db, IConfiguration config)
    {
        _speechBrain = factory.CreateClient("SpeechBrain");
        _db = db;
        _threshold = config.GetValue<double>("VoiceLogin:Threshold", 0.82);
    }

    public async Task<VoiceEnrollResponse> EnrollSampleAsync(string userId, string audioBase64, int sampleIndex)
    {
        var embedding = await GetEmbeddingAsync(audioBase64);

        var filter = Builders<User>.Filter.Eq(u => u.Id, userId);
        var user = await _db.Users.Find(filter).FirstOrDefaultAsync()
                   ?? throw new InvalidOperationException("User not found.");

        // Ensure VoiceSamples list is large enough
        user.VoiceSamples ??= new List<double[]>();
        while (user.VoiceSamples.Count <= sampleIndex)
            user.VoiceSamples.Add(Array.Empty<double>());

        user.VoiceSamples[sampleIndex] = embedding;

        var samplesCollected = user.VoiceSamples.Count(s => s.Length > 0);
        var isComplete = samplesCollected >= 3;

        if (isComplete)
        {
            // Average the 3 embeddings into VoicePrint, then clear samples
            var filled = user.VoiceSamples.Where(s => s.Length > 0).Take(3).ToList();
            var avg = new double[192];
            foreach (var sample in filled)
                for (var i = 0; i < 192; i++)
                    avg[i] += sample[i] / filled.Count;

            // L2 normalize the average
            var norm = Math.Sqrt(avg.Sum(x => x * x));
            if (norm > 0)
                for (var i = 0; i < 192; i++)
                    avg[i] /= norm;

            var update = Builders<User>.Update
                .Set(u => u.VoicePrint, avg)
                .Unset(u => u.VoiceSamples);
            await _db.Users.UpdateOneAsync(filter, update);
        }
        else
        {
            var update = Builders<User>.Update.Set(u => u.VoiceSamples, user.VoiceSamples);
            await _db.Users.UpdateOneAsync(filter, update);
        }

        return new VoiceEnrollResponse
        {
            Success = true,
            SamplesCollected = samplesCollected,
            IsComplete = isComplete
        };
    }

    public async Task<(string? userId, string? displayName, double confidence)> IdentifyAsync(string audioBase64)
    {
        var query = await GetEmbeddingAsync(audioBase64);

        // Fetch all users with a VoicePrint
        var hasVoicePrint = Builders<User>.Filter.And(
            Builders<User>.Filter.Exists(u => u.VoicePrint),
            Builders<User>.Filter.Ne(u => u.VoicePrint, null));
        var users = await _db.Users.Find(hasVoicePrint).ToListAsync();

        if (users.Count == 0)
            return (null, null, 0.0);

        // Find best cosine similarity match
        var bestScore = 0.0;
        User? bestUser = null;

        foreach (var user in users)
        {
            if (user.VoicePrint is not { Length: 192 }) continue;
            var score = CosineSimilarity(user.VoicePrint, query);
            if (score > bestScore)
            {
                bestScore = score;
                bestUser = user;
            }
        }

        if (bestUser is null || bestScore < _threshold)
            return (null, null, bestScore);

        return (bestUser.Id, bestUser.DisplayName, bestScore);
    }

    private async Task<double[]> GetEmbeddingAsync(string audioBase64)
    {
        HttpResponseMessage response;
        try
        {
            response = await _speechBrain.PostAsJsonAsync("/embed",
                new { audio_base64 = audioBase64 }, JsonOpts);
        }
        catch (HttpRequestException)
        {
            throw new InvalidOperationException(
                "Voice service is not running. Please start the SpeechBrain service on port 5100.");
        }

        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync();
            throw new InvalidOperationException($"SpeechBrain service error: {err}");
        }

        var result = await response.Content.ReadFromJsonAsync<EmbedResult>(JsonOpts)
                     ?? throw new InvalidOperationException("Empty response from SpeechBrain service.");

        return result.Embedding;
    }

    private static double CosineSimilarity(double[] stored, double[] query)
    {
        double dot = 0, na = 0, nb = 0;
        for (var i = 0; i < stored.Length; i++)
        {
            dot += stored[i] * query[i];
            na  += stored[i] * stored[i];
            nb  += query[i]  * query[i];
        }
        var denom = Math.Sqrt(na) * Math.Sqrt(nb);
        return denom > 0 ? dot / denom : 0.0;
    }

    private sealed class EmbedResult
    {
        public double[] Embedding { get; set; } = Array.Empty<double>();
    }
}
