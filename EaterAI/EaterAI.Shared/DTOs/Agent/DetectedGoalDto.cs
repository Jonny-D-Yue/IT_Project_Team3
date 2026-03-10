namespace EaterAI.Shared.DTOs.Agent;

public class DetectedGoalDto
{
    public bool IsLowCalorie { get; set; }
    public bool IsLowSodium { get; set; }
    public bool IsHighProtein { get; set; }
    public bool IsVegan { get; set; }
    public bool IsSpicy { get; set; }
    public decimal? MaxBudget { get; set; }
    public List<string> Allergens { get; set; } = new();
    public string RawGoalSummary { get; set; } = string.Empty;
}
