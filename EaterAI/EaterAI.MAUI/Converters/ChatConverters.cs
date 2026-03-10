using System.Globalization;

namespace EaterAI.MAUI.Converters;

/// <summary>
/// Returns LayoutOptions.End for "user" role, Start for others.
/// </summary>
public class RoleToAlignmentConverter : IValueConverter
{
    public static readonly RoleToAlignmentConverter Instance = new();

    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        return value is string role && role.Equals("user", StringComparison.OrdinalIgnoreCase)
            ? LayoutOptions.End
            : LayoutOptions.Start;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotImplementedException();
}

/// <summary>
/// Returns a background color based on chat role.
/// </summary>
public class RoleToColorConverter : IValueConverter
{
    public static readonly RoleToColorConverter Instance = new();

    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        return value is string role && role.Equals("user", StringComparison.OrdinalIgnoreCase)
            ? Color.FromArgb("#DCF8C6")
            : Color.FromArgb("#F0F0F0");
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotImplementedException();
}

/// <summary>
/// Returns a color indicating mic recording state.
/// </summary>
public class MicRecordingColorConverter : IValueConverter
{
    public static readonly MicRecordingColorConverter Instance = new();

    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        return value is bool isRecording && isRecording
            ? Colors.Red
            : Colors.LightGray;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotImplementedException();
}

/// <summary>
/// Returns a color indicating TTS enabled state.
/// </summary>
public class TtsEnabledColorConverter : IValueConverter
{
    public static readonly TtsEnabledColorConverter Instance = new();

    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        return value is bool enabled && enabled
            ? Colors.DodgerBlue
            : Colors.LightGray;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotImplementedException();
}

/// <summary>
/// Joins a List&lt;string&gt; into a comma-separated string.
/// </summary>
public class StringListJoinConverter : IValueConverter
{
    public static readonly StringListJoinConverter Instance = new();

    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is IEnumerable<string> list)
            return string.Join(", ", list);
        return string.Empty;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotImplementedException();
}
