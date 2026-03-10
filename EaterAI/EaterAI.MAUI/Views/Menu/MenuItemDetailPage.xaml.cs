using EaterAI.MAUI.ViewModels.Menu;

namespace EaterAI.MAUI.Views.Menu;

public partial class MenuItemDetailPage : ContentPage
{
    public MenuItemDetailPage(MenuItemDetailViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
