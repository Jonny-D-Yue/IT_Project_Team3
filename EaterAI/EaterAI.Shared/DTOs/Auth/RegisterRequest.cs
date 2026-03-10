using EaterAI.Shared.Enums;

namespace EaterAI.Shared.DTOs.Auth;

public class RegisterRequest
{
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public DietType DietType { get; set; } = DietType.None;
    public List<string> Allergies { get; set; } = new();
    public List<MealGoal> Goals { get; set; } = new();
    public decimal Budget { get; set; }
    public UserRole Role { get; set; } = UserRole.Customer;
}
