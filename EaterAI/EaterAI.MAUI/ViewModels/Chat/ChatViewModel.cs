using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using EaterAI.MAUI.Services;
using EaterAI.Shared.DTOs.Chat;

namespace EaterAI.MAUI.ViewModels.Chat;

public partial class ChatViewModel : BaseViewModel
{
    private readonly IChatApiService _chatApi;
    private readonly IVoiceInputService _voiceInput;
    private readonly IVoiceOutputService _voiceOutput;
    private readonly IVoiceApiService _voiceApi;

    [ObservableProperty]
    private string _inputText = string.Empty;

    [ObservableProperty]
    private bool _isMicRecording;

    [ObservableProperty]
    private bool _isTtsEnabled;

    [ObservableProperty]
    private string? _currentSessionId;

    public ObservableCollection<ChatMessageDto> Messages { get; } = new();

    public ChatViewModel(
        IChatApiService chatApi,
        IVoiceInputService voiceInput,
        IVoiceOutputService voiceOutput,
        IVoiceApiService voiceApi)
    {
        _chatApi = chatApi;
        _voiceInput = voiceInput;
        _voiceOutput = voiceOutput;
        _voiceApi = voiceApi;
        Title = "Chat";
    }

    private string CurrentLanguage => Preferences.Get("language", "en-US");

    [RelayCommand]
    private async Task SendMessageAsync()
    {
        if (IsBusy || string.IsNullOrWhiteSpace(InputText)) return;

        var userText = InputText;
        InputText = string.Empty;

        Messages.Add(new ChatMessageDto
        {
            Role = "user",
            Content = userText,
            Timestamp = DateTime.UtcNow
        });

        IsBusy = true;
        try
        {
            var request = new ChatRequest
            {
                SessionId = CurrentSessionId,
                Message = userText,
                Language = CurrentLanguage
            };

            var response = await _chatApi.SendMessageAsync(request);

            if (response is not null)
            {
                CurrentSessionId = response.SessionId;

                Messages.Add(new ChatMessageDto
                {
                    Role = "assistant",
                    Content = response.Reply,
                    Timestamp = response.Timestamp,
                    DishItems = response.DishItems.Count > 0 ? response.DishItems : null
                });

                // Show DashScope combined artistic image
                if (!string.IsNullOrEmpty(response.ImageUrl))
                {
                    Messages.Add(new ChatMessageDto
                    {
                        Role = "image",
                        Content = string.Empty,
                        ImageUrl = response.ImageUrl,
                        Timestamp = response.Timestamp
                    });
                }

                if (IsTtsEnabled && !string.IsNullOrEmpty(response.Reply))
                {
                    var audioBase64 = await _voiceApi.SynthesizeAsync(response.Reply, CurrentLanguage);
                    if (!string.IsNullOrEmpty(audioBase64))
                        await _voiceOutput.SpeakAsync(audioBase64);
                }
            }
        }
        catch (Exception ex)
        {
            Messages.Add(new ChatMessageDto
            {
                Role = "system",
                Content = $"Error: {ex.Message}",
                Timestamp = DateTime.UtcNow
            });
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private async Task StartRecordingAsync()
    {
        if (IsMicRecording) return;
        try
        {
            await _voiceInput.StartRecordingAsync();
            IsMicRecording = true;
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("Error", $"Could not start recording: {ex.Message}", "OK");
        }
    }

    [RelayCommand]
    private async Task DishItemTappedAsync(DishItemDto item)
    {
        if (string.IsNullOrEmpty(item.Id)) return;
        try
        {
            var parameters = new Dictionary<string, object> { { "ItemId", item.Id } };
            await Shell.Current.GoToAsync("///menu/detail", parameters);
        }
        catch { }
    }

    [RelayCommand]
    private async Task StopRecordingAsync()
    {
        if (!IsMicRecording) return;
        IsMicRecording = false;
        IsBusy = true;
        try
        {
            var base64Audio = await _voiceInput.StopAndTranscribeAsync();
            if (!string.IsNullOrEmpty(base64Audio))
            {
                var transcript = await _voiceApi.TranscribeAsync(base64Audio, language: CurrentLanguage);
                InputText = transcript;
            }
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("Error", $"Transcription failed: {ex.Message}", "OK");
        }
        finally
        {
            IsBusy = false;
        }
    }
}
