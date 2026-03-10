using EaterAI.Shared.DTOs.Auth;

namespace EaterAI.MAUI.Services;

public interface IAuthApiService
{
    Task<AuthResponse?> RegisterAsync(RegisterRequest request);
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task<UserMeDto?> GetMeAsync();
    Task UpdateProfileAsync(UpdateProfileRequest request);
}

public class AuthApiService : ApiService, IAuthApiService
{
    public AuthApiService(IHttpClientFactory factory, ISecureTokenStorage tokenStorage)
        : base(factory, tokenStorage)
    {
    }

    public Task<AuthResponse?> RegisterAsync(RegisterRequest request)
        => PostAsync<RegisterRequest, AuthResponse>("/api/auth/register", request);

    public Task<AuthResponse?> LoginAsync(LoginRequest request)
        => PostAsync<LoginRequest, AuthResponse>("/api/auth/login", request);

    public Task<UserMeDto?> GetMeAsync()
        => GetAsync<UserMeDto>("/api/auth/me");

    public Task UpdateProfileAsync(UpdateProfileRequest request)
        => PutAsync<UpdateProfileRequest>("/api/auth/profile", request);
}
