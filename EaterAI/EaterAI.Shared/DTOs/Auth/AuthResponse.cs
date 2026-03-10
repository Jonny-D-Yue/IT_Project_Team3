using EaterAI.Shared.Enums;

namespace EaterAI.Shared.DTOs.Auth;

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserRole Role { get; set; }
}
