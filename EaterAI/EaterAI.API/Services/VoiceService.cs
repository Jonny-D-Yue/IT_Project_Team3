using System.Net.Http.Json;
using System.Text.Json;
using EaterAI.API.Configuration;
using Microsoft.Extensions.Options;

namespace EaterAI.API.Services;

public class VoiceService : IVoiceService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly GoogleCloudSettings _settings;

    private static readonly Dictionary<string, string> TtsVoiceMap = new()
    {
        { "zh-CN", "cmn-CN-Wavenet-A" },
        { "en-US", "en-US-Neural2-D" }
    };

    public VoiceService(IHttpClientFactory httpClientFactory, IOptions<GoogleCloudSettings> googleOptions)
    {
        _httpClientFactory = httpClientFactory;
        _settings = googleOptions.Value;
    }

    public async Task<string> TranscribeAsync(string audioBase64, string encoding, string language = "zh-CN")
    {
        var client = _httpClientFactory.CreateClient("GoogleCloud");

        // Strip WAV header if present — Google STT LINEAR16 needs raw PCM bytes
        if (encoding == "LINEAR16")
            audioBase64 = StripWavHeaderIfPresent(audioBase64);

        var alternativeLanguages = language == "zh-CN"
            ? new[] { "en-US" }
            : new[] { "zh-CN" };

        var requestBody = new
        {
            config = new
            {
                encoding = encoding,
                sampleRateHertz = 16000,
                languageCode = language,
                alternativeLanguageCodes = alternativeLanguages
            },
            audio = new
            {
                content = audioBase64
            }
        };

        var url = $"https://speech.googleapis.com/v1/speech:recognize?key={_settings.SpeechToTextApiKey}";
        var response = await client.PostAsJsonAsync(url, requestBody);
        response.EnsureSuccessStatusCode();

        var responseBody = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(responseBody);
        var root = doc.RootElement;

        if (root.TryGetProperty("results", out var results) &&
            results.GetArrayLength() > 0)
        {
            var firstResult = results[0];
            if (firstResult.TryGetProperty("alternatives", out var alternatives) &&
                alternatives.GetArrayLength() > 0)
            {
                var firstAlt = alternatives[0];
                if (firstAlt.TryGetProperty("transcript", out var transcript))
                    return transcript.GetString() ?? string.Empty;
            }
        }

        return string.Empty;
    }

    public async Task<string> SynthesizeAsync(string text, string language = "zh-CN")
    {
        var client = _httpClientFactory.CreateClient("GoogleCloud");

        var voiceName = TtsVoiceMap.TryGetValue(language, out var name)
            ? name
            : _settings.VoiceName;

        var requestBody = new
        {
            input = new { text = text },
            voice = new
            {
                languageCode = language,
                name = voiceName
            },
            audioConfig = new
            {
                audioEncoding = _settings.AudioEncoding
            }
        };

        var url = $"https://texttospeech.googleapis.com/v1/text:synthesize?key={_settings.TextToSpeechApiKey}";
        var response = await client.PostAsJsonAsync(url, requestBody);
        response.EnsureSuccessStatusCode();

        var responseBody = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(responseBody);
        var root = doc.RootElement;

        if (root.TryGetProperty("audioContent", out var audioContent))
            return audioContent.GetString() ?? string.Empty;

        return string.Empty;
    }

    // Parses WAV container to extract raw PCM bytes starting at the "data" chunk payload
    private static string StripWavHeaderIfPresent(string audioBase64)
    {
        byte[] audioBytes;
        try { audioBytes = Convert.FromBase64String(audioBase64); }
        catch { return audioBase64; }

        // Check RIFF magic bytes
        if (audioBytes.Length < 44 ||
            audioBytes[0] != 'R' || audioBytes[1] != 'I' ||
            audioBytes[2] != 'F' || audioBytes[3] != 'F')
            return audioBase64;

        // Walk WAV chunks to find "data" chunk
        int offset = 12;
        while (offset + 8 <= audioBytes.Length)
        {
            var chunkId = System.Text.Encoding.ASCII.GetString(audioBytes, offset, 4);
            var chunkSize = BitConverter.ToInt32(audioBytes, offset + 4);
            offset += 8;

            if (chunkId == "data")
            {
                var pcmLength = Math.Min(chunkSize, audioBytes.Length - offset);
                return Convert.ToBase64String(audioBytes, offset, pcmLength);
            }

            // Align to even byte boundary per WAV spec
            offset += chunkSize + (chunkSize % 2);
        }

        return audioBase64;
    }
}
