using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using EaterAI.MAUI.Services;
using EaterAI.MAUI.Views.Auth;
using EaterAI.Shared.DTOs.Manager;
using EaterAI.Shared.DTOs.Menu;

namespace EaterAI.MAUI.ViewModels.Manager;

public partial class ManagerViewModel : BaseViewModel
{
    private readonly IMenuApiService _menuApi;
    private readonly IManagerApiService _managerApi;
    private readonly ISecureTokenStorage _tokenStorage;

    [ObservableProperty] private ObservableCollection<RestaurantDto> _restaurants = new();
    [ObservableProperty] private RestaurantDto? _selectedRestaurant;
    [ObservableProperty] private ImageSource? _imageSource;
    [ObservableProperty] private string _imageBase64 = string.Empty;
    [ObservableProperty] private decimal _price;
    [ObservableProperty] private bool _isAnalyzing;
    [ObservableProperty] private bool _hasResult;
    [ObservableProperty] private string _dishName = string.Empty;
    [ObservableProperty] private string _description = string.Empty;
    [ObservableProperty] private int _calories;
    [ObservableProperty] private double _protein;
    [ObservableProperty] private double _fat;
    [ObservableProperty] private double _carbs;
    [ObservableProperty] private bool _isVegan;
    [ObservableProperty] private bool _isSpicy;
    [ObservableProperty] private string _dishType = string.Empty;
    [ObservableProperty] private string _method = string.Empty;
    [ObservableProperty] private ObservableCollection<IngredientDto> _ingredients = new();
    [ObservableProperty] private string _statusMessage = string.Empty;

    public static readonly IReadOnlyList<string> DishTypeOptions =
        new[] { "starter", "snack", "main course", "dessert" };

    public ManagerViewModel(IMenuApiService menuApi, IManagerApiService managerApi, ISecureTokenStorage tokenStorage)
    {
        _menuApi = menuApi;
        _managerApi = managerApi;
        _tokenStorage = tokenStorage;
        Title = "Dish Analyzer";
    }

    [RelayCommand]
    private async Task LoadRestaurantsAsync()
    {
        var list = await _menuApi.GetRestaurantsAsync();
        Restaurants.Clear();
        foreach (var r in list) Restaurants.Add(r);
        if (Restaurants.Count > 0 && SelectedRestaurant is null)
            SelectedRestaurant = Restaurants[0];
    }

    [RelayCommand]
    private async Task PickPhotoAsync()
    {
        try
        {
            var result = await MediaPicker.PickPhotoAsync();
            if (result is null) return;
            await LoadPhotoAsync(result);
        }
        catch (Exception ex) { StatusMessage = $"Pick failed: {ex.Message}"; }
    }

    [RelayCommand]
    private async Task TakePhotoAsync()
    {
        try
        {
            var result = await MediaPicker.CapturePhotoAsync();
            if (result is null) return;
            await LoadPhotoAsync(result);
        }
        catch (Exception ex) { StatusMessage = $"Camera failed: {ex.Message}"; }
    }

    private async Task LoadPhotoAsync(FileResult file)
    {
        using var stream = await file.OpenReadAsync();
        using var ms = new MemoryStream();
        await stream.CopyToAsync(ms);
        ImageBase64 = Convert.ToBase64String(ms.ToArray());
        ms.Position = 0;
        ImageSource = ImageSource.FromStream(() => new MemoryStream(ms.ToArray()));
        HasResult = false;
        StatusMessage = string.Empty;
    }

    [RelayCommand(CanExecute = nameof(CanAnalyze))]
    private async Task AnalyzeAsync()
    {
        if (IsAnalyzing) return;
        IsAnalyzing = true;
        StatusMessage = "Analyzing…";
        try
        {
            var req = new AnalyzeDishRequest
            {
                ImageBase64   = ImageBase64,
                ImageMimeType = "image/jpeg",
                RestaurantId  = SelectedRestaurant!.Id,
                Price         = Price
            };
            var response = await _managerApi.AnalyzeDishAsync(req);
            if (response is { Success: true })
            {
                DishName    = response.Name;
                Description = response.Description;
                Calories    = response.Calories;
                Protein     = response.Protein;
                Fat         = response.Fat;
                Carbs       = response.Carbs;
                IsVegan     = response.IsVegan;
                IsSpicy     = response.IsSpicy;
                DishType    = response.DishType;
                Method      = response.Method;
                Ingredients.Clear();
                foreach (var ing in response.Ingredients) Ingredients.Add(ing);
                HasResult     = true;
                StatusMessage = "Analysis complete — review and add to menu.";
            }
            else
            {
                StatusMessage = $"Analysis failed: {response?.Error ?? "Unknown error"}";
            }
        }
        catch (Exception ex) { StatusMessage = $"Error: {ex.Message}"; }
        finally { IsAnalyzing = false; }
    }

    private bool CanAnalyze() => !string.IsNullOrEmpty(ImageBase64) && SelectedRestaurant is not null;

    partial void OnImageBase64Changed(string value) => AnalyzeCommand.NotifyCanExecuteChanged();
    partial void OnSelectedRestaurantChanged(RestaurantDto? value) => AnalyzeCommand.NotifyCanExecuteChanged();

    [RelayCommand(CanExecute = nameof(HasResult))]
    private async Task AddToMenuAsync()
    {
        if (IsBusy) return;
        IsBusy = true;
        try
        {
            var req = new SaveDishRequest
            {
                RestaurantId = SelectedRestaurant!.Id,
                Name         = DishName,
                Description  = Description,
                Price        = Price,
                Calories     = Calories,
                Protein      = Protein,
                Fat          = Fat,
                Carbs        = Carbs,
                IsVegan      = IsVegan,
                IsSpicy      = IsSpicy,
                DishType     = DishType,
                Method       = Method,
                Tags         = new List<string>(),
                Allergens    = new List<string>(),
                Ingredients  = Ingredients.ToList(),
                ImageBase64  = ImageBase64,
                ImageMimeType = "image/jpeg"
            };
            var id = await _managerApi.SaveDishAsync(req);
            StatusMessage = $"'{DishName}' added to menu! (ID: {id?[..8]}…)";
            // Reset form
            HasResult   = false;
            ImageSource = null;
            ImageBase64 = string.Empty;
            Price       = 0;
            DishName    = string.Empty;
            Description = string.Empty;
            Method      = string.Empty;
            DishType    = string.Empty;
            Ingredients.Clear();
        }
        catch (Exception ex) { StatusMessage = $"Save failed: {ex.Message}"; }
        finally { IsBusy = false; }
    }

    partial void OnHasResultChanged(bool value) => AddToMenuCommand.NotifyCanExecuteChanged();

    [RelayCommand]
    private async Task LogoutAsync()
    {
        Preferences.Remove("user_role");
        await _tokenStorage.ClearTokenAsync();
        var loginPage = IPlatformApplication.Current!.Services.GetRequiredService<LoginPage>();
        await Shell.Current.Navigation.PushModalAsync(new NavigationPage(loginPage));
    }
}
