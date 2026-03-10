using EaterAI.MAUI.ViewModels.Favorites;
using EaterAI.Shared.DTOs.Favorites;

namespace EaterAI.MAUI.Views.Favorites;

public partial class FavoritesPage : ContentPage
{
    private readonly FavoritesViewModel _viewModel;

    public FavoritesPage(FavoritesViewModel viewModel)
    {
        InitializeComponent();
        _viewModel = viewModel;
        BindingContext = viewModel;
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        _viewModel.LoadCollectionsCommand.Execute(null);
    }

    private async void OnCollectionTapped(object sender, TappedEventArgs e)
    {
        if (e.Parameter is FavoriteCollectionDto collection)
        {
            var navigationParameter = new Dictionary<string, object>
            {
                { "Collection", collection }
            };
            await Shell.Current.GoToAsync("favorites/collection", navigationParameter);
        }
    }
}
