namespace EaterAI.API.Services;

public interface IImageGenerationService
{
    /// <summary>
    /// Generates a combined food image for the given list of dish names.
    /// Returns the image URL, or null if generation fails or times out.
    /// </summary>
    Task<string?> GenerateAsync(List<string> dishNames);
}
