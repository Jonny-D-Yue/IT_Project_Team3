using EaterAI.MAUI.ViewModels.Auth;

namespace EaterAI.MAUI.Views.Auth;

public partial class VoiceEnrollPage : ContentPage
{
    public VoiceEnrollPage(VoiceEnrollViewModel vm)
    {
        InitializeComponent();
        BindingContext = vm;
    }
}
