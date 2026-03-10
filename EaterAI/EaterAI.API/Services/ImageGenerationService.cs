using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using EaterAI.API.Configuration;
using Microsoft.Extensions.Options;

namespace EaterAI.API.Services;

public class ImageGenerationService : IImageGenerationService
{
    private const string SubmitUrl = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis";
    private const string TaskPollBaseUrl = "https://dashscope.aliyuncs.com/api/v1/tasks/";
    private const int MaxPollSeconds = 60;
    private const int PollIntervalMs = 2000;

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly QwenSettings _settings;
    private readonly ILogger<ImageGenerationService> _logger;

    public ImageGenerationService(
        IHttpClientFactory httpClientFactory,
        IOptions<QwenSettings> settings,
        ILogger<ImageGenerationService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<string?> GenerateAsync(List<string> dishNames)
    {
        if (dishNames.Count == 0)
            return null;

        try
        {
            var taskId = await SubmitTaskAsync(dishNames);
            if (string.IsNullOrEmpty(taskId))
                return null;

            return await PollForResultAsync(taskId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Image generation failed for dishes: {Dishes}", string.Join(", ", dishNames));
            return null;
        }
    }

    private async Task<string?> SubmitTaskAsync(List<string> dishNames)
    {
        var dishList = string.Join(", ", dishNames);
        var prompt = $"A beautiful restaurant food photography composition featuring: {dishList}. Elegant plating, soft natural lighting, appetizing, high quality, multiple dishes arranged together.";

        var body = new
        {
            model = _settings.ImageModel,
            input = new { prompt },
            parameters = new { n = 1, size = "1024*1024" }
        };

        var client = _httpClientFactory.CreateClient("DashScope");
        using var request = new HttpRequestMessage(HttpMethod.Post, SubmitUrl);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ApiKey);
        request.Headers.Add("X-DashScope-Async", "enable");
        request.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

        var response = await client.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("DashScope image submit failed: {Status} {Body}", response.StatusCode, content);
            return null;
        }

        var json = JsonNode.Parse(content);
        return json?["output"]?["task_id"]?.GetValue<string>();
    }

    private async Task<string?> PollForResultAsync(string taskId)
    {
        var client = _httpClientFactory.CreateClient("DashScope");
        var deadline = DateTime.UtcNow.AddSeconds(MaxPollSeconds);

        while (DateTime.UtcNow < deadline)
        {
            await Task.Delay(PollIntervalMs);

            using var request = new HttpRequestMessage(HttpMethod.Get, TaskPollBaseUrl + taskId);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ApiKey);

            var response = await client.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("DashScope task poll failed: {Status}", response.StatusCode);
                return null;
            }

            var json = JsonNode.Parse(content);
            var status = json?["output"]?["task_status"]?.GetValue<string>();

            if (status == "SUCCEEDED")
            {
                return json?["output"]?["results"]?[0]?["url"]?.GetValue<string>();
            }

            if (status == "FAILED")
            {
                _logger.LogWarning("DashScope image task failed for taskId: {TaskId}", taskId);
                return null;
            }
        }

        _logger.LogWarning("DashScope image generation timed out for taskId: {TaskId}", taskId);
        return null;
    }
}
