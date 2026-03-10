namespace EaterAI.MAUI.Services;

public interface ISecureTokenStorage
{
    Task<string?> GetTokenAsync();
    Task SetTokenAsync(string token);
    Task ClearTokenAsync();
}

public class SecureTokenStorage : ISecureTokenStorage
{
    private const string TokenKey = "auth_token";

    public Task<string?> GetTokenAsync()
        => SecureStorage.GetAsync(TokenKey);

    public Task SetTokenAsync(string token)
        => SecureStorage.SetAsync(TokenKey, token);

    public Task ClearTokenAsync()
    {
        SecureStorage.Remove(TokenKey);
        return Task.CompletedTask;
    }
}
