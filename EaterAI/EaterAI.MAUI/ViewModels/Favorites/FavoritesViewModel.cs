using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using EaterAI.MAUI.Services;
using EaterAI.Shared.DTOs.Favorites;

namespace EaterAI.MAUI.ViewModels.Favorites;

public partial class FavoritesViewModel : BaseViewModel
{
    private readonly IFavoritesApiService _favoritesApi;

    [ObservableProperty]
    private string _newCollectionName = string.Empty;

    public ObservableCollection<FavoriteCollectionDto> Collections { get; } = new();

    public FavoritesViewModel(IFavoritesApiService favoritesApi)
    {
        _favoritesApi = favoritesApi;
        Title = "Favorites";
    }

    [RelayCommand]
    private async Task LoadCollectionsAsync()
    {
        if (IsBusy) return;
        IsBusy = true;
        try
        {
            var collections = await _favoritesApi.GetCollectionsAsync();
            Collections.Clear();
            foreach (var c in collections)
                Collections.Add(c);
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("Error", $"Failed to load collections: {ex.Message}", "OK");
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private async Task CreateCollectionAsync()
    {
        if (IsBusy || string.IsNullOrWhiteSpace(NewCollectionName)) return;
        IsBusy = true;
        try
        {
            var collection = await _favoritesApi.CreateCollectionAsync(NewCollectionName);
            if (collection is not null)
            {
                Collections.Add(collection);
                NewCollectionName = string.Empty;
            }
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("Error", $"Failed to create collection: {ex.Message}", "OK");
        }
        finally
        {
            IsBusy = false;
        }
    }
}
