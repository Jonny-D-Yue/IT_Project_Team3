using EaterAI.Shared.DTOs.Manager;
using EaterAI.Shared.DTOs.Menu;

namespace EaterAI.MAUI.Services;

public interface IManagerApiService
{
    Task<AnalyzeDishResponse?> AnalyzeDishAsync(AnalyzeDishRequest request);
    Task<string?> SaveDishAsync(SaveDishRequest request);
    Task<List<MenuItemDto>> GetAllDishesAsync();
    Task<MenuItemDto?> GetDishByIdAsync(string id);
}

public class ManagerApiService : ApiService, IManagerApiService
{
    public ManagerApiService(IHttpClientFactory factory, ISecureTokenStorage tokenStorage)
        : base(factory, tokenStorage)
    {
    }

    public Task<AnalyzeDishResponse?> AnalyzeDishAsync(AnalyzeDishRequest request)
        => PostAsync<AnalyzeDishRequest, AnalyzeDishResponse>("/api/manager/analyze-dish", request);

    public async Task<string?> SaveDishAsync(SaveDishRequest request)
    {
        var result = await PostAsync<SaveDishRequest, SaveDishResult>("/api/manager/save-dish", request);
        return result?.MenuItemId;
    }

    public async Task<List<MenuItemDto>> GetAllDishesAsync()
        => await GetAsync<List<MenuItemDto>>("/api/manager/dishes") ?? new();

    public Task<MenuItemDto?> GetDishByIdAsync(string id)
        => GetAsync<MenuItemDto>($"/api/manager/dishes/{id}");

    private sealed class SaveDishResult
    {
        public string? MenuItemId { get; set; }
    }
}
