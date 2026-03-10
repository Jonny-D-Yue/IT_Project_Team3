using EaterAI.MAUI.ViewModels.Manager;

namespace EaterAI.MAUI.Views.Manager;

public partial class ManagerPage : ContentPage
{
    private readonly ManagerViewModel _vm;

    public ManagerPage(ManagerViewModel vm)
    {
        InitializeComponent();
        _vm = vm;
        BindingContext = vm;
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        _vm.LoadRestaurantsCommand.Execute(null);
    }

    private async void OnViewAllClicked(object sender, EventArgs e)
    {
        await Shell.Current.GoToAsync("managerdishlist");
    }
}
