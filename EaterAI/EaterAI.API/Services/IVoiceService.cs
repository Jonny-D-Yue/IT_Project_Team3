namespace EaterAI.API.Services;

public interface IVoiceService
{
    Task<string> TranscribeAsync(string audioBase64, string encoding, string language = "zh-CN");
    Task<string> SynthesizeAsync(string text, string language = "zh-CN");
}
