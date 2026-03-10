namespace EaterAI.Shared.DTOs.Voice;

public class SynthesizeRequest
{
    public string Text { get; set; } = string.Empty;
    public string Language { get; set; } = "zh-CN";
}
