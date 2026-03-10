using EaterAI.MAUI.Configuration;
using EaterAI.MAUI.Services;
using EaterAI.MAUI.ViewModels.Auth;
using EaterAI.MAUI.ViewModels.Chat;
using EaterAI.MAUI.ViewModels.Favorites;
using EaterAI.MAUI.ViewModels.History;
using EaterAI.MAUI.ViewModels.Manager;
using EaterAI.MAUI.ViewModels.Menu;
using EaterAI.MAUI.ViewModels.Profile;
using EaterAI.MAUI.Views.Auth;
using EaterAI.MAUI.Views.Chat;
using EaterAI.MAUI.Views.Favorites;
using EaterAI.MAUI.Views.History;
using EaterAI.MAUI.Views.Manager;
using EaterAI.MAUI.Views.Menu;
using EaterAI.MAUI.Views.Profile;
using Microsoft.Extensions.Logging;
using Plugin.Maui.Audio;

namespace EaterAI.MAUI;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();

        builder
            .UseMauiApp<App>()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
            });

        // Named HttpClient
        builder.Services.AddHttpClient("EaterAI", client =>
        {
            client.BaseAddress = new Uri(ApiSettings.BaseUrl);
        });

        // Services — Singletons
        builder.Services.AddSingleton<ISecureTokenStorage, SecureTokenStorage>();
        builder.Services.AddSingleton<IAuthApiService, AuthApiService>();
        builder.Services.AddSingleton<IMenuApiService, MenuApiService>();
        builder.Services.AddSingleton<IChatApiService, ChatApiService>();
        builder.Services.AddSingleton<IMealLogApiService, MealLogApiService>();
        builder.Services.AddSingleton<IFavoritesApiService, FavoritesApiService>();
        builder.Services.AddSingleton<IVoiceApiService, VoiceApiService>();
        builder.Services.AddSingleton<IVoiceInputService, VoiceInputService>();
        builder.Services.AddSingleton<IVoiceOutputService, VoiceOutputService>();
        builder.Services.AddSingleton<IVoiceAuthApiService, VoiceAuthApiService>();
        builder.Services.AddSingleton<IManagerApiService, ManagerApiService>();

        // ViewModels — Transient
        builder.Services.AddTransient<LoginViewModel>();
        builder.Services.AddTransient<RegisterViewModel>();
        builder.Services.AddTransient<VoiceEnrollViewModel>();
        builder.Services.AddTransient<MenuBrowserViewModel>();
        builder.Services.AddTransient<MenuItemDetailViewModel>();
        builder.Services.AddTransient<ChatViewModel>();
        builder.Services.AddTransient<HistoryViewModel>();
        builder.Services.AddTransient<FavoritesViewModel>();
        builder.Services.AddTransient<CollectionDetailViewModel>();
        builder.Services.AddTransient<ProfileViewModel>();
        builder.Services.AddTransient<ManagerViewModel>();
        builder.Services.AddTransient<ManagerDishListViewModel>();
        builder.Services.AddTransient<ManagerDishDetailViewModel>();

        // Pages — Transient
        builder.Services.AddTransient<LoginPage>();
        builder.Services.AddTransient<RegisterPage>();
        builder.Services.AddTransient<VoiceEnrollPage>();
        builder.Services.AddTransient<MenuBrowserPage>();
        builder.Services.AddTransient<MenuItemDetailPage>();
        builder.Services.AddTransient<ChatPage>();
        builder.Services.AddTransient<HistoryPage>();
        builder.Services.AddTransient<FavoritesPage>();
        builder.Services.AddTransient<CollectionDetailPage>();
        builder.Services.AddTransient<ProfilePage>();
        builder.Services.AddTransient<ManagerPage>();
        builder.Services.AddTransient<ManagerDishListPage>();
        builder.Services.AddTransient<ManagerDishDetailPage>();

        // Shell and App
        builder.Services.AddTransient<AppShell>();

#if DEBUG
        builder.Logging.AddDebug();
#endif

        return builder.Build();
    }
}
