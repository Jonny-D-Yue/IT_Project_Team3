namespace EaterAI.Shared.DTOs.Auth;

public class VoiceEnrollRequest
{
    public string AudioBase64 { get; set; } = string.Empty;
    public int SampleIndex { get; set; }
}
