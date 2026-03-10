using EaterAI.API.Data;
using EaterAI.API.Models;
using EaterAI.Shared.DTOs.Meal;
using MongoDB.Driver;

namespace EaterAI.API.Services;

public class MealLogService : IMealLogService
{
    private readonly MongoDbContext _db;

    public MealLogService(MongoDbContext db)
    {
        _db = db;
    }

    public async Task LogMealAsync(string userId, string menuItemId)
    {
        var menuItem = await _db.MenuItems
            .Find(Builders<MenuItem>.Filter.Eq(m => m.Id, menuItemId))
            .FirstOrDefaultAsync();

        if (menuItem is null)
            throw new KeyNotFoundException($"MenuItem '{menuItemId}' not found.");

        var log = new MealLog
        {
            UserId = userId,
            MenuItemId = menuItemId,
            Calories = menuItem.Calories,
            Timestamp = DateTime.UtcNow
        };

        await _db.MealLogs.InsertOneAsync(log);
    }

    public async Task<List<MealLogDto>> GetHistoryAsync(string userId, int limit = 50)
    {
        var filter = Builders<MealLog>.Filter.Eq(l => l.UserId, userId);
        var sort = Builders<MealLog>.Sort.Descending(l => l.Timestamp);

        var logs = await _db.MealLogs
            .Find(filter)
            .Sort(sort)
            .Limit(limit)
            .ToListAsync();

        if (logs.Count == 0)
            return new List<MealLogDto>();

        // Fetch all referenced menu items in one query
        var menuItemIds = logs.Select(l => l.MenuItemId).Distinct().ToList();
        var menuItemFilter = Builders<MenuItem>.Filter.In(m => m.Id, menuItemIds);
        var menuItems = await _db.MenuItems.Find(menuItemFilter).ToListAsync();
        var menuItemDict = menuItems.ToDictionary(m => m.Id, m => m.Name);

        return logs.Select(log => new MealLogDto
        {
            Id = log.Id,
            MenuItemId = log.MenuItemId,
            MenuItemName = menuItemDict.TryGetValue(log.MenuItemId, out var name) ? name : string.Empty,
            Calories = log.Calories,
            Timestamp = log.Timestamp
        }).ToList();
    }

    public async Task<WeeklyStatsDto> GetWeeklyStatsAsync(string userId)
    {
        var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
        var filter = Builders<MealLog>.Filter.And(
            Builders<MealLog>.Filter.Eq(l => l.UserId, userId),
            Builders<MealLog>.Filter.Gte(l => l.Timestamp, sevenDaysAgo)
        );

        var logs = await _db.MealLogs.Find(filter).ToListAsync();

        if (logs.Count == 0)
        {
            return new WeeklyStatsDto
            {
                TotalCalories = 0,
                MealCount = 0,
                TopDish = string.Empty,
                DailyBreakdown = new Dictionary<DayOfWeek, int>()
            };
        }

        var totalCalories = logs.Sum(l => l.Calories);
        var mealCount = logs.Count;

        // Top dish: most frequently logged menuItemId, resolved to name
        var topMenuItemId = logs
            .GroupBy(l => l.MenuItemId)
            .OrderByDescending(g => g.Count())
            .Select(g => g.Key)
            .FirstOrDefault() ?? string.Empty;

        var topDishName = string.Empty;
        if (!string.IsNullOrEmpty(topMenuItemId))
        {
            var topItem = await _db.MenuItems
                .Find(Builders<MenuItem>.Filter.Eq(m => m.Id, topMenuItemId))
                .FirstOrDefaultAsync();
            topDishName = topItem?.Name ?? topMenuItemId;
        }

        // Daily breakdown: sum calories by DayOfWeek
        var dailyBreakdown = logs
            .GroupBy(l => l.Timestamp.DayOfWeek)
            .ToDictionary(g => g.Key, g => g.Sum(l => l.Calories));

        return new WeeklyStatsDto
        {
            TotalCalories = totalCalories,
            MealCount = mealCount,
            TopDish = topDishName,
            DailyBreakdown = dailyBreakdown
        };
    }
}
