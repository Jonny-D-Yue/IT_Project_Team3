using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using EaterAI.MAUI.Services;
using EaterAI.Shared.DTOs.Auth;
using EaterAI.Shared.Enums;

namespace EaterAI.MAUI.ViewModels.Auth;

public partial class LoginViewModel : BaseViewModel
{
    private readonly IAuthApiService _authApi;
    private readonly ISecureTokenStorage _tokenStorage;
    private readonly IVoiceInputService _voiceInput;
    private readonly IVoiceAuthApiService _voiceAuthApi;

    [ObservableProperty]
    private string _email = string.Empty;

    [ObservableProperty]
    private string _password = string.Empty;

    [ObservableProperty]
    private string _errorMessage = string.Empty;

    [ObservableProperty]
    private bool _isVoiceListening;

    [ObservableProperty]
    private string _voiceLoginStatus = string.Empty;

    public LoginViewModel(
        IAuthApiService authApi,
        ISecureTokenStorage tokenStorage,
        IVoiceInputService voiceInput,
        IVoiceAuthApiService voiceAuthApi)
    {
        _authApi = authApi;
        _tokenStorage = tokenStorage;
        _voiceInput = voiceInput;
        _voiceAuthApi = voiceAuthApi;
        Title = "Login";
    }

    [RelayCommand]
    private async Task LoginAsync()
    {
        if (IsBusy) return;

        ErrorMessage = string.Empty;

        if (string.IsNullOrWhiteSpace(Email) || string.IsNullOrWhiteSpace(Password))
        {
            ErrorMessage = "Please enter your email and password.";
            return;
        }

        IsBusy = true;
        try
        {
            var request = new LoginRequest { Email = Email, Password = Password };
            var response = await _authApi.LoginAsync(request);

            if (response is not null && !string.IsNullOrEmpty(response.Token))
            {
                await _tokenStorage.SetTokenAsync(response.Token);
                Preferences.Set("user_role", response.Role.ToString());
                var route = response.Role == UserRole.Manager ? "//manager" : "//menu";
                await Shell.Current.GoToAsync(route);
            }
            else
            {
                ErrorMessage = "Invalid email or password.";
            }
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Login failed: {ex.Message}";
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private async Task VoiceLoginAsync()
    {
        if (IsVoiceListening || IsBusy) return;

        ErrorMessage = string.Empty;
        IsVoiceListening = true;
        VoiceLoginStatus = "Listening (5 seconds)...";

        string audioBase64;
        try
        {
            audioBase64 = await _voiceInput.StartAndRecordForSecondsAsync(5);
        }
        finally
        {
            IsVoiceListening = false;
        }

        if (string.IsNullOrEmpty(audioBase64))
        {
            VoiceLoginStatus = "Recording failed, please try again";
            return;
        }

        VoiceLoginStatus = "Identifying...";
        try
        {
            var result = await _voiceAuthApi.IdentifyAsync(audioBase64);
            if (result is { Matched: true } && !string.IsNullOrEmpty(result.Token))
            {
                await _tokenStorage.SetTokenAsync(result.Token);
                Preferences.Set("user_role", result.Role.ToString());
                var route = result.Role == UserRole.Manager ? "//manager" : "//menu";
                await Shell.Current.GoToAsync(route);
            }
            else
            {
                VoiceLoginStatus = "Voice not recognized. Try again or use password login.";
            }
        }
        catch (Exception ex)
        {
            VoiceLoginStatus = $"Error: {ex.Message}";
        }
    }
}
