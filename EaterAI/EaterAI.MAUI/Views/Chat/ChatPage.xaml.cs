using EaterAI.MAUI.ViewModels.Chat;

namespace EaterAI.MAUI.Views.Chat;

public partial class ChatPage : ContentPage
{
    private readonly ChatViewModel _viewModel;

    public ChatPage(ChatViewModel viewModel)
    {
        InitializeComponent();
        _viewModel = viewModel;
        BindingContext = viewModel;
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        _viewModel.Messages.CollectionChanged += OnMessagesChanged;
    }

    protected override void OnDisappearing()
    {
        base.OnDisappearing();
        _viewModel.Messages.CollectionChanged -= OnMessagesChanged;
    }

    private void OnMessagesChanged(object? sender, System.Collections.Specialized.NotifyCollectionChangedEventArgs e)
    {
        if (_viewModel.Messages.Count == 0) return;
        var lastMessage = _viewModel.Messages[^1];
        MainThread.BeginInvokeOnMainThread(() =>
        {
            try { MessagesCollectionView.ScrollTo(lastMessage, position: ScrollToPosition.End, animate: false); }
            catch { }
        });
    }

    private void OnMicPressed(object sender, EventArgs e)
    {
        _viewModel.StartRecordingCommand.Execute(null);
    }

    private void OnMicReleased(object sender, EventArgs e)
    {
        _viewModel.StopRecordingCommand.Execute(null);
    }

    private void OnTtsToggleClicked(object sender, EventArgs e)
    {
        _viewModel.IsTtsEnabled = !_viewModel.IsTtsEnabled;
    }
}
