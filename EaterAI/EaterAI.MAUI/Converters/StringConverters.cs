using System.Globalization;

namespace EaterAI.MAUI.Converters;

/// <summary>
/// Returns true if the string is not null or empty.
/// </summary>
public class StringNotEmptyConverter : IValueConverter
{
    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        => !string.IsNullOrEmpty(value as string);

    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}

/// <summary>Converts int (0-3) to ProgressBar progress (0.0-1.0) in thirds.</summary>
public class IntToThirdProgressConverter : IValueConverter
{
    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        => value is int n ? Math.Clamp(n / 3.0, 0.0, 1.0) : 0.0;

    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}

public static class StringConverters
{
    public static StringNotEmptyConverter IsNotNullOrEmpty { get; } = new();
    public static IntToThirdProgressConverter IntToThirdProgress { get; } = new();
}
