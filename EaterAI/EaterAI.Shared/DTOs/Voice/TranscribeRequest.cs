namespace EaterAI.Shared.DTOs.Voice;

public class TranscribeRequest
{
    public string AudioBase64 { get; set; } = string.Empty;
    public string Encoding { get; set; } = "LINEAR16";
    public string Language { get; set; } = "zh-CN";
}
