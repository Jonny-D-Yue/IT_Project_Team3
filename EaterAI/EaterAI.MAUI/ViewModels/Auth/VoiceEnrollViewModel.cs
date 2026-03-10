using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using EaterAI.MAUI.Services;

namespace EaterAI.MAUI.ViewModels.Auth;

public partial class VoiceEnrollViewModel : BaseViewModel
{
    private readonly IVoiceInputService _voiceInput;
    private readonly IVoiceAuthApiService _voiceAuthApi;

    private static readonly string[] Instructions =
    {
        "Please say: Today is a great day, I want to go to a restaurant",
        "Please read: The quick brown fox jumps over the lazy dog",
        "Please say: I enjoy all kinds of food, especially spicy and Japanese cuisine"
    };

    [ObservableProperty]
    private int _currentSample;

    [ObservableProperty]
    private bool _isRecording;

    [ObservableProperty]
    private string _instruction = string.Empty;

    [ObservableProperty]
    private string _statusMessage = string.Empty;

    public VoiceEnrollViewModel(IVoiceInputService voiceInput, IVoiceAuthApiService voiceAuthApi)
    {
        _voiceInput = voiceInput;
        _voiceAuthApi = voiceAuthApi;
        Title = "Voice Enrollment";
        UpdateInstruction();
    }

    private void UpdateInstruction()
    {
        Instruction = CurrentSample < Instructions.Length
            ? Instructions[CurrentSample]
            : string.Empty;
    }

    [RelayCommand]
    private async Task RecordSampleAsync()
    {
        if (IsRecording || IsBusy) return;

        StatusMessage = string.Empty;
        IsRecording = true;

        string audioBase64;
        try
        {
            audioBase64 = await _voiceInput.StartAndRecordForSecondsAsync(8);
        }
        finally
        {
            IsRecording = false;
        }

        if (string.IsNullOrEmpty(audioBase64))
        {
            StatusMessage = "Recording failed, please try again";
            return;
        }

        IsBusy = true;
        StatusMessage = "Uploading...";
        try
        {
            var result = await _voiceAuthApi.EnrollSampleAsync(audioBase64, CurrentSample);
            if (result is null)
            {
                StatusMessage = "Upload failed, please try again";
                return;
            }

            if (result.IsComplete)
            {
                await NavigateToMenuAsync();
            }
            else
            {
                CurrentSample++;
                UpdateInstruction();
                StatusMessage = $"Sample {result.SamplesCollected}/3 recorded";
            }
        }
        catch (Exception ex)
        {
            StatusMessage = $"Error: {ex.Message}";
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private async Task SkipAsync() => await NavigateToMenuAsync();

    private static async Task NavigateToMenuAsync()
    {
        // Pop all open modals (VoiceEnrollPage + LoginPage stack)
        while (Shell.Current.Navigation.ModalStack.Count > 0)
            await Shell.Current.Navigation.PopModalAsync(false);
        await Shell.Current.GoToAsync("//menu");
    }
}
