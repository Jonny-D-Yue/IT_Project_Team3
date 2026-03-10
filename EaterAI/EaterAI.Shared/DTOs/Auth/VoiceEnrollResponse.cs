namespace EaterAI.Shared.DTOs.Auth;

public class VoiceEnrollResponse
{
    public bool Success { get; set; }
    public int SamplesCollected { get; set; }
    public bool IsComplete { get; set; }
}
