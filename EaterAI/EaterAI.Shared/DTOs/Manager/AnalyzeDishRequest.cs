namespace EaterAI.Shared.DTOs.Manager;
public class AnalyzeDishRequest
{
    public string ImageBase64   { get; set; } = string.Empty;
    public string ImageMimeType { get; set; } = "image/jpeg";
    public string RestaurantId  { get; set; } = string.Empty;
    public decimal Price        { get; set; }
}
