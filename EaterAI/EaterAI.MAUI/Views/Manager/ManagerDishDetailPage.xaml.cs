using EaterAI.MAUI.ViewModels.Manager;

namespace EaterAI.MAUI.Views.Manager;

public partial class ManagerDishDetailPage : ContentPage
{
    public ManagerDishDetailPage(ManagerDishDetailViewModel vm)
    {
        InitializeComponent();
        BindingContext = vm;
    }
}
