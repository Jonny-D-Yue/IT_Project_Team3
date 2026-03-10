namespace EaterAI.Shared.DTOs.Meal;

public class WeeklyStatsDto
{
    public int TotalCalories { get; set; }
    public int MealCount { get; set; }
    public string TopDish { get; set; } = string.Empty;
    public Dictionary<DayOfWeek, int> DailyBreakdown { get; set; } = new();
}
