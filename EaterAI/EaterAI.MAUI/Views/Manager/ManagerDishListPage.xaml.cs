using EaterAI.MAUI.ViewModels.Manager;
using EaterAI.Shared.DTOs.Menu;

namespace EaterAI.MAUI.Views.Manager;

public partial class ManagerDishListPage : ContentPage
{
    private readonly ManagerDishListViewModel _vm;

    public ManagerDishListPage(ManagerDishListViewModel vm)
    {
        InitializeComponent();
        _vm = vm;
        BindingContext = vm;
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        _vm.LoadCommand.Execute(null);
    }

    private async void OnDishSelected(object sender, SelectionChangedEventArgs e)
    {
        if (e.CurrentSelection.FirstOrDefault() is not MenuItemDto item) return;
        DishList.SelectedItem = null;
        await Shell.Current.GoToAsync("managerdishdetail",
            new Dictionary<string, object> { { "Item", item } });
    }
}
