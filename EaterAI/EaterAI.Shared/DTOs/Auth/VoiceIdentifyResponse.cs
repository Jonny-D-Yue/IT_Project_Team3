using EaterAI.Shared.Enums;

namespace EaterAI.Shared.DTOs.Auth;

public class VoiceIdentifyResponse
{
    public bool Matched { get; set; }
    public string? Token { get; set; }
    public string? UserId { get; set; }
    public string? DisplayName { get; set; }
    public DateTime ExpiresAt { get; set; }
    public double Confidence { get; set; }
    public UserRole Role { get; set; }
}
