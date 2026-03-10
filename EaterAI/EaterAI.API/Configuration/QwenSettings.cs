namespace EaterAI.API.Configuration;

public class QwenSettings
{
    public string ApiKey { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://dashscope.aliyuncs.com/compatible-mode/v1";
    public string Model { get; set; } = "qwen3-max";
    public int MaxTokens { get; set; } = 1024;
    public string ImageModel { get; set; } = "wanx2.1-t2i-turbo";
    public string VisionModel { get; set; } = "qwen-vl-max";
}
