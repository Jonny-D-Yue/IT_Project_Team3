using Plugin.Maui.Audio;

namespace EaterAI.MAUI.Services;

public interface IVoiceOutputService
{
    Task SpeakAsync(string audioBase64);
}

public class VoiceOutputService : IVoiceOutputService
{
    public async Task SpeakAsync(string audioBase64)
    {
        if (string.IsNullOrEmpty(audioBase64))
            return;

        var bytes = Convert.FromBase64String(audioBase64);
        var tempFile = Path.Combine(FileSystem.CacheDirectory, $"tts_{Guid.NewGuid()}.mp3");

        await File.WriteAllBytesAsync(tempFile, bytes);

        await using var stream = File.OpenRead(tempFile);
        var player = AudioManager.Current.CreatePlayer(stream);
        player.Play();

        // Wait for playback to finish then clean up
        while (player.IsPlaying)
            await Task.Delay(100);

        player.Dispose();

        try { File.Delete(tempFile); } catch { /* ignore cleanup errors */ }
    }
}
