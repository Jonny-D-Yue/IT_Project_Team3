using EaterAI.MAUI.ViewModels.Auth;

namespace EaterAI.MAUI.Views.Auth;

public partial class RegisterPage : ContentPage
{
    public RegisterPage(RegisterViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
