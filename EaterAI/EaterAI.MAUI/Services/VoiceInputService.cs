using Plugin.Maui.Audio;

namespace EaterAI.MAUI.Services;

public interface IVoiceInputService
{
    Task StartRecordingAsync();
    Task<string> StopAndTranscribeAsync();
    Task<string> StartAndRecordForSecondsAsync(int seconds);
}

public class VoiceInputService : IVoiceInputService
{
    private IAudioRecorder? _recorder;

    public async Task StartRecordingAsync()
    {
        _recorder = AudioManager.Current.CreateRecorder();
        await _recorder.StartAsync();
    }

    public async Task<string> StopAndTranscribeAsync()
    {
        if (_recorder is null)
            return string.Empty;

        var result = await _recorder.StopAsync();

        if (result is null)
            return string.Empty;

        await using var stream = result.GetAudioStream();
        using var ms = new MemoryStream();
        await stream.CopyToAsync(ms);
        var bytes = ms.ToArray();
        return Convert.ToBase64String(bytes);
    }

    public async Task<string> StartAndRecordForSecondsAsync(int seconds)
    {
        await StartRecordingAsync();
        await Task.Delay(seconds * 1000);
        return await StopAndTranscribeAsync();
    }
}
