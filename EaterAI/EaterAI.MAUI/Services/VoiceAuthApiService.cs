using EaterAI.Shared.DTOs.Auth;

namespace EaterAI.MAUI.Services;

public interface IVoiceAuthApiService
{
    Task<VoiceEnrollResponse?> EnrollSampleAsync(string audioBase64, int sampleIndex);
    Task<VoiceIdentifyResponse?> IdentifyAsync(string audioBase64);
    Task<bool> GetVoiceStatusAsync();
}

public class VoiceAuthApiService : ApiService, IVoiceAuthApiService
{
    public VoiceAuthApiService(IHttpClientFactory factory, ISecureTokenStorage tokenStorage)
        : base(factory, tokenStorage)
    {
    }

    public Task<VoiceEnrollResponse?> EnrollSampleAsync(string audioBase64, int sampleIndex)
        => PostAsync<VoiceEnrollRequest, VoiceEnrollResponse>(
            "/api/auth/voice/enroll",
            new VoiceEnrollRequest { AudioBase64 = audioBase64, SampleIndex = sampleIndex });

    public Task<VoiceIdentifyResponse?> IdentifyAsync(string audioBase64)
        => PostAsync<VoiceIdentifyRequest, VoiceIdentifyResponse>(
            "/api/auth/voice/identify",
            new VoiceIdentifyRequest { AudioBase64 = audioBase64 });

    public async Task<bool> GetVoiceStatusAsync()
    {
        try
        {
            var result = await GetAsync<VoiceStatusResult>("/api/auth/voice/status");
            return result?.HasVoicePrint ?? false;
        }
        catch
        {
            return false;
        }
    }

    private sealed class VoiceStatusResult
    {
        public bool HasVoicePrint { get; set; }
    }
}
