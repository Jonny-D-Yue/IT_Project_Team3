using EaterAI.Shared.Enums;

namespace EaterAI.Shared.DTOs.Auth;

public class UpdateProfileRequest
{
    public string DisplayName { get; set; } = string.Empty;
    public DietType DietType { get; set; } = DietType.None;
    public decimal Budget { get; set; }
}
