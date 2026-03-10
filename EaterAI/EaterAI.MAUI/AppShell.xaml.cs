using EaterAI.MAUI.Services;
using EaterAI.MAUI.Views.Auth;
using EaterAI.MAUI.Views.Favorites;
using EaterAI.MAUI.Views.Manager;
using EaterAI.MAUI.Views.Menu;

namespace EaterAI.MAUI;

public partial class AppShell : Shell
{
    private readonly ISecureTokenStorage _tokenStorage;

    public AppShell(ISecureTokenStorage tokenStorage)
    {
        _tokenStorage = tokenStorage;
        InitializeComponent();

        Routing.RegisterRoute("menu/detail", typeof(MenuItemDetailPage));
        Routing.RegisterRoute("favorites/collection", typeof(CollectionDetailPage));
        Routing.RegisterRoute("auth/register", typeof(RegisterPage));
        Routing.RegisterRoute("voiceenroll", typeof(VoiceEnrollPage));
        Routing.RegisterRoute("managerdishlist", typeof(ManagerDishListPage));
        Routing.RegisterRoute("managerdishdetail", typeof(ManagerDishDetailPage));
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();

        var token = await _tokenStorage.GetTokenAsync();
        if (string.IsNullOrEmpty(token))
        {
            var loginPage = IPlatformApplication.Current!.Services.GetRequiredService<LoginPage>();
            await Navigation.PushModalAsync(new NavigationPage(loginPage));
        }
        else
        {
            var role = Preferences.Get("user_role", "Customer");
            if (role == "Manager")
                await Shell.Current.GoToAsync("//manager");
        }
    }
}
