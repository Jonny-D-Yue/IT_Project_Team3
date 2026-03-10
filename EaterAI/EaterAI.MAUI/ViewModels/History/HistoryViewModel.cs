using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using EaterAI.MAUI.Services;
using EaterAI.Shared.DTOs.Meal;

namespace EaterAI.MAUI.ViewModels.History;

public partial class HistoryViewModel : BaseViewModel
{
    private readonly IMealLogApiService _mealLogApi;

    [ObservableProperty]
    private WeeklyStatsDto? _stats;

    public ObservableCollection<MealLogDto> Logs { get; } = new();

    public HistoryViewModel(IMealLogApiService mealLogApi)
    {
        _mealLogApi = mealLogApi;
        Title = "History";
    }

    [RelayCommand]
    private async Task LoadDataAsync()
    {
        if (IsBusy) return;
        IsBusy = true;
        try
        {
            var logsTask = _mealLogApi.GetHistoryAsync();
            var statsTask = _mealLogApi.GetWeeklyStatsAsync();

            await Task.WhenAll(logsTask, statsTask);

            Logs.Clear();
            foreach (var log in logsTask.Result)
                Logs.Add(log);

            Stats = statsTask.Result;
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("Error", $"Failed to load history: {ex.Message}", "OK");
        }
        finally
        {
            IsBusy = false;
        }
    }
}
