using EaterAI.Shared.DTOs.Meal;

namespace EaterAI.API.Services;

public interface IMealLogService
{
    Task LogMealAsync(string userId, string menuItemId);
    Task<List<MealLogDto>> GetHistoryAsync(string userId, int limit = 50);
    Task<WeeklyStatsDto> GetWeeklyStatsAsync(string userId);
}
