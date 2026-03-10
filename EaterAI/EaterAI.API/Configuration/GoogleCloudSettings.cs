namespace EaterAI.API.Configuration;

public class GoogleCloudSettings
{
    public string SpeechToTextApiKey { get; set; } = string.Empty;
    public string TextToSpeechApiKey { get; set; } = string.Empty;
    public string LanguageCode { get; set; } = "zh-CN";
    public string VoiceName { get; set; } = "cmn-CN-Wavenet-A";
    public string AudioEncoding { get; set; } = "MP3";
}
