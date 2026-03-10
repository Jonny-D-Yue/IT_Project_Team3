using EaterAI.Shared.DTOs.Meal;

namespace EaterAI.MAUI.Services;

public interface IMealLogApiService
{
    Task LogMealAsync(string menuItemId);
    Task<List<MealLogDto>> GetHistoryAsync(int limit = 50);
    Task<WeeklyStatsDto?> GetWeeklyStatsAsync();
}

public class MealLogApiService : ApiService, IMealLogApiService
{
    public MealLogApiService(IHttpClientFactory factory, ISecureTokenStorage tokenStorage)
        : base(factory, tokenStorage)
    {
    }

    public async Task LogMealAsync(string menuItemId)
    {
        var request = new LogMealRequest { MenuItemId = menuItemId };
        await PostAsync<LogMealRequest, object>("/api/meals/log", request);
    }

    public async Task<List<MealLogDto>> GetHistoryAsync(int limit = 50)
        => await GetAsync<List<MealLogDto>>($"/api/meals/history?limit={limit}") ?? new List<MealLogDto>();

    public Task<WeeklyStatsDto?> GetWeeklyStatsAsync()
        => GetAsync<WeeklyStatsDto>("/api/meals/stats/weekly");
}
