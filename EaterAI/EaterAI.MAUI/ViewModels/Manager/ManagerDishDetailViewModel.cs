using CommunityToolkit.Mvvm.ComponentModel;
using EaterAI.Shared.DTOs.Menu;

namespace EaterAI.MAUI.ViewModels.Manager;

public partial class ManagerDishDetailViewModel : BaseViewModel, IQueryAttributable
{
    [ObservableProperty] private MenuItemDto? _item;

    public ManagerDishDetailViewModel()
    {
        Title = "Dish Detail";
    }

    public void ApplyQueryAttributes(IDictionary<string, object> query)
    {
        if (query.TryGetValue("Item", out var val) && val is MenuItemDto item)
        {
            Item = item;
            Title = item.Name;
        }
    }
}
