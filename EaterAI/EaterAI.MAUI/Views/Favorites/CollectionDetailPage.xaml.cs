using EaterAI.MAUI.ViewModels.Favorites;

namespace EaterAI.MAUI.Views.Favorites;

public partial class CollectionDetailPage : ContentPage
{
    public CollectionDetailPage(CollectionDetailViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
