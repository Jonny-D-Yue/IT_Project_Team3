using EaterAI.API.Models;
using EaterAI.Shared.DTOs.Auth;

namespace EaterAI.API.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<User?> GetUserByIdAsync(string userId);
    Task UpdateProfileAsync(string userId, UpdateProfileRequest request);
    AuthResponse GenerateTokenForUser(User user);
}
