using System.Globalization;

namespace EaterAI.MAUI.Converters;

/// <summary>
/// Inverts a bool value. Matches the CommunityToolkit.Maui BoolConverters.Not API.
/// </summary>
public class InvertedBoolConverter : IValueConverter
{
    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        => value is bool b ? !b : value;

    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => value is bool b ? !b : value;
}

/// <summary>
/// Static holder matching CommunityToolkit.Maui's BoolConverters static class API.
/// Usage in XAML: {x:Static converters:BoolConverters.Not}
/// </summary>
/// <summary>
/// Returns true if the value is a non-empty IList.
/// </summary>
public class ListNotEmptyConverter : IValueConverter
{
    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        => value is System.Collections.IList list && list.Count > 0;

    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}

/// <summary>Returns "停止" when recording, "录制" otherwise.</summary>
public class RecordingLabelConverter : IValueConverter
{
    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        => value is true ? "Stop" : "Record";

    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}

/// <summary>Returns Colors.Red when recording, Primary color otherwise.</summary>
public class RecordingColorConverter : IValueConverter
{
    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        => value is true ? Colors.Red : Color.FromArgb("#512BD4");

    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}

public static class BoolConverters
{
    public static InvertedBoolConverter Not { get; } = new();
    public static ListNotEmptyConverter IsListNotEmpty { get; } = new();
    public static RecordingLabelConverter ToRecordingLabel { get; } = new();
    public static RecordingColorConverter ToRecordColor { get; } = new();
}
