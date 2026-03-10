using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using EaterAI.MAUI.Services;
using EaterAI.Shared.DTOs.Menu;

namespace EaterAI.MAUI.ViewModels.Menu;

public partial class MenuItemDetailViewModel : BaseViewModel, IQueryAttributable
{
    private readonly IMealLogApiService _mealLogApi;
    private readonly IFavoritesApiService _favoritesApi;
    private readonly IMenuApiService _menuApi;

    [ObservableProperty]
    private MenuItemDto? _item;

    [ObservableProperty]
    private string _collectionId = string.Empty;

    public MenuItemDetailViewModel(IMealLogApiService mealLogApi, IFavoritesApiService favoritesApi, IMenuApiService menuApi)
    {
        _mealLogApi = mealLogApi;
        _favoritesApi = favoritesApi;
        _menuApi = menuApi;
        Title = "Item Detail";
    }

    public void ApplyQueryAttributes(IDictionary<string, object> query)
    {
        if (query.TryGetValue("Item", out var value) && value is MenuItemDto item)
            Item = item;
        else if (query.TryGetValue("ItemId", out var idValue) && idValue is string itemId)
            LoadItemByIdCommand.Execute(itemId);
    }

    [RelayCommand]
    private async Task LoadItemByIdAsync(string id)
    {
        IsBusy = true;
        try { Item = await _menuApi.GetItemByIdAsync(id); }
        catch { }
        finally { IsBusy = false; }
    }

    partial void OnItemChanged(MenuItemDto? value)
    {
        if (value is not null)
            Title = value.Name;
    }

    [RelayCommand]
    private async Task LogMealAsync()
    {
        if (Item is null || IsBusy) return;
        IsBusy = true;
        try
        {
            await _mealLogApi.LogMealAsync(Item.Id);
            await Shell.Current.DisplayAlert("Success", $"{Item.Name} has been logged!", "OK");
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("Error", $"Failed to log meal: {ex.Message}", "OK");
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private async Task AddToFavoritesAsync()
    {
        if (Item is null || IsBusy) return;

        if (string.IsNullOrEmpty(CollectionId))
        {
            await Shell.Current.DisplayAlert("Info", "Please enter a collection ID first.", "OK");
            return;
        }

        IsBusy = true;
        try
        {
            await _favoritesApi.AddItemAsync(CollectionId, Item.Id);
            await Shell.Current.DisplayAlert("Success", $"{Item.Name} added to favorites!", "OK");
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("Error", $"Failed to add to favorites: {ex.Message}", "OK");
        }
        finally
        {
            IsBusy = false;
        }
    }
}
