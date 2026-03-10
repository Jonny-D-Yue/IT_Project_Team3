using EaterAI.MAUI.ViewModels.Menu;
using EaterAI.Shared.DTOs.Menu;

namespace EaterAI.MAUI.Views.Menu;

public partial class MenuBrowserPage : ContentPage
{
    private readonly MenuBrowserViewModel _viewModel;

    public MenuBrowserPage(MenuBrowserViewModel viewModel)
    {
        InitializeComponent();
        _viewModel = viewModel;
        BindingContext = viewModel;
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        if (_viewModel.Restaurants.Count == 0)
            _viewModel.LoadRestaurantsCommand.Execute(null);
    }

    private async void OnMenuItemSelected(object sender, SelectionChangedEventArgs e)
    {
        if (e.CurrentSelection.FirstOrDefault() is not MenuItemDto item) return;

        // Deselect immediately so re-tapping the same item works
        MenuCollectionView.SelectedItem = null;

        try
        {
            var navigationParameter = new Dictionary<string, object> { { "Item", item } };
            await Shell.Current.GoToAsync("///menu/detail", navigationParameter);
        }
        catch (Exception ex)
        {
            await DisplayAlert("Error", $"Navigation failed: {ex.Message}", "OK");
        }
    }
}
