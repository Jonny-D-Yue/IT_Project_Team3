using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using EaterAI.MAUI.Services;
using EaterAI.Shared.DTOs.Favorites;
using EaterAI.Shared.DTOs.Menu;

namespace EaterAI.MAUI.ViewModels.Favorites;

[QueryProperty(nameof(Collection), "Collection")]
public partial class CollectionDetailViewModel : BaseViewModel
{
    private readonly IFavoritesApiService _favoritesApi;

    [ObservableProperty]
    private FavoriteCollectionDto? _collection;

    public ObservableCollection<MenuItemDto> Items { get; } = new();

    public CollectionDetailViewModel(IFavoritesApiService favoritesApi)
    {
        _favoritesApi = favoritesApi;
        Title = "Collection";
    }

    partial void OnCollectionChanged(FavoriteCollectionDto? value)
    {
        if (value is not null)
        {
            Title = value.Name;
            Items.Clear();
            foreach (var item in value.MenuItems)
                Items.Add(item);
        }
    }

    [RelayCommand]
    private async Task RemoveItemAsync(string menuItemId)
    {
        if (Collection is null || IsBusy) return;
        IsBusy = true;
        try
        {
            await _favoritesApi.RemoveItemAsync(Collection.Id, menuItemId);
            var toRemove = Items.FirstOrDefault(i => i.Id == menuItemId);
            if (toRemove is not null)
                Items.Remove(toRemove);
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("Error", $"Failed to remove item: {ex.Message}", "OK");
        }
        finally
        {
            IsBusy = false;
        }
    }
}
