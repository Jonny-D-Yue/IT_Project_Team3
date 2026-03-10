using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using EaterAI.MAUI.Services;
using EaterAI.Shared.DTOs.Menu;
using EaterAI.Shared.Enums;

namespace EaterAI.MAUI.ViewModels.Menu;

public partial class MenuBrowserViewModel : BaseViewModel
{
    private readonly IMenuApiService _menuApi;

    [ObservableProperty]
    private RestaurantDto? _selectedRestaurant;

    [ObservableProperty]
    private bool _filterVegan;

    [ObservableProperty]
    private bool _filterSpicy;

    [ObservableProperty]
    private bool _filterLowCal;

    [ObservableProperty]
    private bool _filterHighProtein;

    [ObservableProperty]
    private SortBy _sortBy = SortBy.Popularity;

    public ObservableCollection<RestaurantDto> Restaurants { get; } = new();
    public ObservableCollection<MenuItemDto> MenuItems { get; } = new();

    public MenuBrowserViewModel(IMenuApiService menuApi)
    {
        _menuApi = menuApi;
        Title = "Menu";
    }

    partial void OnSelectedRestaurantChanged(RestaurantDto? value)
    {
        if (value is not null)
            LoadMenuItemsCommand.Execute(null);
    }

    partial void OnFilterVeganChanged(bool value) => ApplyFilterCommand.Execute(null);
    partial void OnFilterSpicyChanged(bool value) => ApplyFilterCommand.Execute(null);
    partial void OnFilterLowCalChanged(bool value) => ApplyFilterCommand.Execute(null);
    partial void OnFilterHighProteinChanged(bool value) => ApplyFilterCommand.Execute(null);
    partial void OnSortByChanged(SortBy value) => ApplyFilterCommand.Execute(null);

    [RelayCommand]
    private async Task LoadRestaurantsAsync()
    {
        if (IsBusy) return;
        IsBusy = true;
        try
        {
            var restaurants = await _menuApi.GetRestaurantsAsync();
            Restaurants.Clear();
            foreach (var r in restaurants)
                Restaurants.Add(r);

//            if (Restaurants.Count > 0 && SelectedRestaurant is null)
//                SelectedRestaurant = Restaurants[0];
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("Error", $"Failed to load restaurants: {ex.Message}", "OK");
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private async Task LoadMenuItemsAsync()
    {
        if (SelectedRestaurant is null) return;
        if (IsBusy) return;
        IsBusy = true;
        try
        {
            var items = await _menuApi.GetMenuItemsAsync(SelectedRestaurant.Id);
            MenuItems.Clear();
            foreach (var item in items)
                MenuItems.Add(item);
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("Error", $"Failed to load menu: {ex.Message}", "OK");
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private async Task ApplyFilterAsync()
    {
        if (IsBusy) return;
        IsBusy = true;
        try
        {
            var filterRequest = new MenuFilterRequest
            {
                RestaurantId = SelectedRestaurant?.Id,
                IsVegan = FilterVegan ? true : null,
                IsSpicy = FilterSpicy ? true : null,
                MaxCalories = FilterLowCal ? 500 : null,
                MinProtein = FilterHighProtein ? 20.0 : null,
                SortBy = SortBy
            };

            var items = await _menuApi.FilterMenuAsync(filterRequest);
            MenuItems.Clear();
            foreach (var item in items)
                MenuItems.Add(item);
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("Error", $"Failed to apply filter: {ex.Message}", "OK");
        }
        finally
        {
            IsBusy = false;
        }
    }
}
