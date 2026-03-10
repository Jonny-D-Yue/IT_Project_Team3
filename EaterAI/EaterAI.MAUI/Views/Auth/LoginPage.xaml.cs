using EaterAI.MAUI.ViewModels.Auth;

namespace EaterAI.MAUI.Views.Auth;

public partial class LoginPage : ContentPage
{
    public LoginPage(LoginViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }

    private async void OnRegisterTapped(object sender, EventArgs e)
    {
        await Navigation.PushAsync(
            IPlatformApplication.Current!.Services.GetRequiredService<RegisterPage>());
    }
}
