using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using EaterAI.API.Configuration;
using EaterAI.API.Data;
using EaterAI.API.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace EaterAI.API.Services;

public class DishImageService : IDishImageService
{
    private const string SubmitUrl = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis";
    private const string TaskPollBaseUrl = "https://dashscope.aliyuncs.com/api/v1/tasks/";
    private const int MaxPollSeconds = 90;
    private const int PollIntervalMs = 3000;

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly QwenSettings _settings;
    private readonly MongoDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly string _apiBaseUrl;
    private readonly ILogger<DishImageService> _logger;

    public DishImageService(
        IHttpClientFactory httpClientFactory,
        IOptions<QwenSettings> settings,
        MongoDbContext db,
        IWebHostEnvironment env,
        IConfiguration configuration,
        ILogger<DishImageService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _settings = settings.Value;
        _db = db;
        _env = env;
        _apiBaseUrl = configuration["Api:BaseUrl"] ?? "http://localhost:5284";
        _logger = logger;
    }

    public async Task<string?> EnsureDishImageAsync(MenuItem dish)
    {
        if (!string.IsNullOrEmpty(dish.ImageUrl))
            return dish.ImageUrl;

        try
        {
            var slug = ToSlug(dish.Name);
            var imageUrl = await EnsureLocalImageAsync(
                folder: "dishes",
                slug: slug,
                promptFactory: () => $"Food photography of {dish.Name}: {dish.Description}. Elegant plating, soft natural lighting, appetizing, high quality restaurant photo, close-up shot.");

            if (imageUrl is not null)
            {
                await _db.MenuItems.UpdateOneAsync(
                    Builders<MenuItem>.Filter.Eq(m => m.Id, dish.Id),
                    Builders<MenuItem>.Update.Set(m => m.ImageUrl, imageUrl));
                dish.ImageUrl = imageUrl;
            }

            return imageUrl;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to generate image for dish: {DishName}", dish.Name);
            return null;
        }
    }

    public async Task<string?> EnsureRestaurantLogoAsync(Restaurant restaurant)
    {
        if (!string.IsNullOrEmpty(restaurant.LogoUrl))
            return restaurant.LogoUrl;

        try
        {
            var slug = ToSlug(restaurant.Name);
            var logoUrl = await EnsureLocalImageAsync(
                folder: "restaurants",
                slug: slug,
                promptFactory: () => $"Restaurant logo for {restaurant.Name}, {restaurant.Cuisine} cuisine. Modern minimal design, clean background, professional food brand logo.");

            if (logoUrl is not null)
            {
                await _db.Restaurants.UpdateOneAsync(
                    Builders<Restaurant>.Filter.Eq(r => r.Id, restaurant.Id),
                    Builders<Restaurant>.Update.Set(r => r.LogoUrl, logoUrl));
                restaurant.LogoUrl = logoUrl;
            }

            return logoUrl;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to generate logo for restaurant: {RestaurantName}", restaurant.Name);
            return null;
        }
    }

    // Returns existing file URL if already on disk, otherwise generates via DashScope.
    private async Task<string?> EnsureLocalImageAsync(string folder, string slug, Func<string> promptFactory)
    {
        var relativePath = $"images/{folder}/{slug}.jpg";
        var fullPath = Path.Combine(_env.WebRootPath, "images", folder, $"{slug}.jpg");

        if (File.Exists(fullPath))
            return $"{_apiBaseUrl}/{relativePath}";

        return await GenerateAndStoreAsync(promptFactory(), folder, slug);
    }

    private async Task<string?> GenerateAndStoreAsync(string prompt, string folder, string slug)
    {
        var taskId = await SubmitTaskAsync(prompt);
        if (taskId is null)
            return null;

        var dashscopeImageUrl = await PollForResultAsync(taskId);
        if (dashscopeImageUrl is null)
            return null;

        return await DownloadAndSaveAsync(dashscopeImageUrl, folder, slug);
    }

    private static string ToSlug(string name) =>
        string.Concat(name.ToLowerInvariant().Select(c => char.IsLetterOrDigit(c) ? c : '-')).Trim('-');

    private async Task<string?> SubmitTaskAsync(string prompt)
    {
        var body = new
        {
            model = _settings.ImageModel,
            input = new { prompt },
            parameters = new { n = 1, size = "512*512" }
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
            _logger.LogWarning("DashScope dish image submit failed: {Status} {Body}", response.StatusCode, content);
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
                return json?["output"]?["results"]?[0]?["url"]?.GetValue<string>();

            if (status == "FAILED")
            {
                _logger.LogWarning("DashScope image task failed: {TaskId}", taskId);
                return null;
            }
        }

        _logger.LogWarning("DashScope image generation timed out: {TaskId}", taskId);
        return null;
    }

    private async Task<string?> DownloadAndSaveAsync(string imageUrl, string folder, string slug)
    {
        var client = _httpClientFactory.CreateClient();
        var bytes = await client.GetByteArrayAsync(imageUrl);

        var relativePath = $"images/{folder}/{slug}.jpg";
        var fullPath = Path.Combine(_env.WebRootPath, "images", folder, $"{slug}.jpg");

        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
        await File.WriteAllBytesAsync(fullPath, bytes);

        return $"{_apiBaseUrl}/{relativePath}";
    }
}
