using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using EaterAI.MAUI.Services;
using EaterAI.Shared.DTOs.Menu;

namespace EaterAI.MAUI.ViewModels.Manager;

public partial class ManagerDishListViewModel : BaseViewModel
{
    private readonly IManagerApiService _managerApi;

    [ObservableProperty] private ObservableCollection<MenuItemDto> _dishes = new();

    public ManagerDishListViewModel(IManagerApiService managerApi)
    {
        _managerApi = managerApi;
        Title = "All Dishes";
    }

    [RelayCommand]
    private async Task LoadAsync()
    {
        if (IsBusy) return;
        IsBusy = true;
        try
        {
            var list = await _managerApi.GetAllDishesAsync();
            Dishes.Clear();
            foreach (var d in list) Dishes.Add(d);
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("Error", ex.Message, "OK");
        }
        finally { IsBusy = false; }
    }
}
