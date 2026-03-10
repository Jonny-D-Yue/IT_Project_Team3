using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using EaterAI.MAUI.Services;
using EaterAI.MAUI.Views.Auth;
using EaterAI.Shared.DTOs.Auth;
using EaterAI.Shared.Enums;
using EaterAI.MAUI.Views.Manager;

namespace EaterAI.MAUI.ViewModels.Auth;

public partial class RegisterViewModel : BaseViewModel
{
    private readonly IAuthApiService _authApi;
    private readonly ISecureTokenStorage _tokenStorage;

    [ObservableProperty]
    private string _displayName = string.Empty;

    [ObservableProperty]
    private string _email = string.Empty;

    [ObservableProperty]
    private string _password = string.Empty;

    [ObservableProperty]
    private DietType _selectedDietType = DietType.None;

    [ObservableProperty]
    private decimal _budget;

    [ObservableProperty]
    private string _errorMessage = string.Empty;

    public ObservableCollection<string> Allergies { get; } = new();
    public ObservableCollection<MealGoal> Goals { get; } = new();

    public List<DietType> DietTypes { get; } = Enum.GetValues<DietType>().ToList();

    public List<string> RoleOptions { get; } = new() { "Customer", "Manager" };

    [ObservableProperty]
    private string _selectedRoleDisplay = "Customer";

    public RegisterViewModel(IAuthApiService authApi, ISecureTokenStorage tokenStorage)
    {
        _authApi = authApi;
        _tokenStorage = tokenStorage;
        Title = "Register";
    }

    [RelayCommand]
    private async Task RegisterAsync()
    {
        if (IsBusy) return;

        ErrorMessage = string.Empty;

        if (string.IsNullOrWhiteSpace(DisplayName) || string.IsNullOrWhiteSpace(Email) || string.IsNullOrWhiteSpace(Password))
        {
            ErrorMessage = "Please fill in all required fields.";
            return;
        }

        IsBusy = true;
        try
        {
            var request = new RegisterRequest
            {
                DisplayName = DisplayName,
                Email = Email,
                Password = Password,
                DietType = SelectedDietType,
                Allergies = Allergies.ToList(),
                Goals = Goals.ToList(),
                Budget = Budget,
                Role = SelectedRoleDisplay == "Manager" ? UserRole.Manager : UserRole.Customer
            };

            var response = await _authApi.RegisterAsync(request);

            if (response is not null && !string.IsNullOrEmpty(response.Token))
            {
                await _tokenStorage.SetTokenAsync(response.Token);
                Preferences.Set("user_role", response.Role.ToString());

                if (response.Role == UserRole.Manager)
                {
                    await Shell.Current.GoToAsync("//manager");
                }
                else
                {
                    // Voice enrollment disabled — go directly to menu
                    await Shell.Current.GoToAsync("//menu");
                }
            }
            else
            {
                ErrorMessage = "Registration failed. Please try again.";
            }
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Registration failed: {ex.Message}";
        }
        finally
        {
            IsBusy = false;
        }
    }
}
