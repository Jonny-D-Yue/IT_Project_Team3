using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using EaterAI.MAUI.Services;
using EaterAI.Shared.DTOs.Auth;
using EaterAI.Shared.Enums;

namespace EaterAI.MAUI.ViewModels.Profile;

public partial class ProfileViewModel : BaseViewModel
{
    private readonly IAuthApiService _authApi;
    private readonly ISecureTokenStorage _tokenStorage;

    [ObservableProperty]
    private string _displayName = string.Empty;

    [ObservableProperty]
    private DietType _dietType = DietType.None;

    [ObservableProperty]
    private decimal _budget;

    [ObservableProperty]
    private string _errorMessage = string.Empty;

    [ObservableProperty]
    private string _selectedLanguage = "English";

    public ObservableCollection<string> Allergies { get; } = new();
    public List<DietType> DietTypes { get; } = Enum.GetValues<DietType>().ToList();
    public List<string> Languages { get; } = new() { "Chinese", "English" };

    public ProfileViewModel(IAuthApiService authApi, ISecureTokenStorage tokenStorage)
    {
        _authApi = authApi;
        _tokenStorage = tokenStorage;
        Title = "Profile";

        var savedLanguage = Preferences.Get("language_display", "English");
        _selectedLanguage = savedLanguage;
    }

    [RelayCommand]
    private async Task LoadProfileAsync()
    {
        if (IsBusy) return;
        IsBusy = true;
        try
        {
            var me = await _authApi.GetMeAsync();
            if (me is not null)
            {
                DisplayName = me.DisplayName;
                DietType = me.Profile.DietType;
                Budget = me.Profile.Budget;
            }
        }
        catch { }
        finally { IsBusy = false; }
    }

    [RelayCommand]
    private async Task SaveAsync()
    {
        if (IsBusy) return;
        IsBusy = true;
        try
        {
            await _authApi.UpdateProfileAsync(new UpdateProfileRequest
            {
                DisplayName = DisplayName,
                DietType = DietType,
                Budget = Budget
            });

            var languageCode = SelectedLanguage == "English" ? "en-US" : "zh-CN";
            Preferences.Set("language", languageCode);
            Preferences.Set("language_display", SelectedLanguage);

            await Shell.Current.DisplayAlert("Saved", "Profile updated successfully.", "OK");
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Save failed: {ex.Message}";
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private async Task LogoutAsync()
    {
        await _tokenStorage.ClearTokenAsync();

        var loginPage = IPlatformApplication.Current!.Services
            .GetRequiredService<EaterAI.MAUI.Views.Auth.LoginPage>();

        await Shell.Current.Navigation.PushModalAsync(new NavigationPage(loginPage));
    }
}
