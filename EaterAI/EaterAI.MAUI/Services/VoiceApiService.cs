using EaterAI.Shared.DTOs.Voice;

namespace EaterAI.MAUI.Services;

public interface IVoiceApiService
{
    Task<string> TranscribeAsync(string audioBase64, string encoding = "LINEAR16", string language = "zh-CN");
    Task<string> SynthesizeAsync(string text, string language = "zh-CN");
}

public class VoiceApiService : ApiService, IVoiceApiService
{
    public VoiceApiService(IHttpClientFactory factory, ISecureTokenStorage tokenStorage)
        : base(factory, tokenStorage)
    {
    }

    public async Task<string> TranscribeAsync(string audioBase64, string encoding = "LINEAR16", string language = "zh-CN")
    {
        var request = new TranscribeRequest { AudioBase64 = audioBase64, Encoding = encoding, Language = language };
        var response = await PostAsync<TranscribeRequest, TranscribeResponse>("/api/voice/transcribe", request);
        return response?.Transcript ?? string.Empty;
    }

    public async Task<string> SynthesizeAsync(string text, string language = "zh-CN")
    {
        var request = new SynthesizeRequest { Text = text, Language = language };
        var response = await PostAsync<SynthesizeRequest, SynthesizeResponse>("/api/voice/synthesize", request);
        return response?.AudioBase64 ?? string.Empty;
    }
}
