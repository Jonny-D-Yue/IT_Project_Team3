using EaterAI.Shared.Enums;

namespace EaterAI.Shared.DTOs.Auth;

public class UserMeDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public UserProfileDto Profile { get; set; } = new();
}

public class UserProfileDto
{
    public DietType DietType { get; set; } = DietType.None;
    public decimal Budget { get; set; }
    public List<string> Allergies { get; set; } = new();
}
