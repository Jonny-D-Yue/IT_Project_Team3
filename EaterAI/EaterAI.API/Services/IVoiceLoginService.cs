using EaterAI.Shared.DTOs.Auth;

namespace EaterAI.API.Services;

public interface IVoiceLoginService
{
    Task<VoiceEnrollResponse> EnrollSampleAsync(string userId, string audioBase64, int sampleIndex);
    Task<(string? userId, string? displayName, double confidence)> IdentifyAsync(string audioBase64);
}
