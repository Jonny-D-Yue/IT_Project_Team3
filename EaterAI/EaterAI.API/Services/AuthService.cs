using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EaterAI.Shared.Enums;
using EaterAI.API.Configuration;
using EaterAI.API.Data;
using EaterAI.API.Models;
using EaterAI.Shared.DTOs.Auth;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;

namespace EaterAI.API.Services;

public class AuthService : IAuthService
{
    private readonly MongoDbContext _db;
    private readonly JwtSettings _jwtSettings;

    public AuthService(MongoDbContext db, IOptions<JwtSettings> jwtOptions)
    {
        _db = db;
        _jwtSettings = jwtOptions.Value;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var existingFilter = Builders<User>.Filter.Eq(u => u.Email, request.Email);
        var existing = await _db.Users.Find(existingFilter).FirstOrDefaultAsync();
        if (existing is not null)
            throw new InvalidOperationException($"Email '{request.Email}' is already registered.");

        var user = new User
        {
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            DisplayName = request.DisplayName,
            Role = request.Role,
            Profile = new UserProfile
            {
                DietType = request.DietType,
                Allergies = request.Allergies,
                Goals = request.Goals,
                Budget = request.Budget
            }
        };

        await _db.Users.InsertOneAsync(user);

        var (token, expiresAt) = GenerateToken(user);
        return new AuthResponse
        {
            Token = token,
            UserId = user.Id,
            DisplayName = user.DisplayName,
            ExpiresAt = expiresAt,
            Role = user.Role
        };
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var filter = Builders<User>.Filter.Eq(u => u.Email, request.Email);
        var user = await _db.Users.Find(filter).FirstOrDefaultAsync();
        if (user is null)
            throw new UnauthorizedAccessException("Invalid email or password.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        var (token, expiresAt) = GenerateToken(user);
        return new AuthResponse
        {
            Token = token,
            UserId = user.Id,
            DisplayName = user.DisplayName,
            ExpiresAt = expiresAt,
            Role = user.Role
        };
    }

    public async Task<User?> GetUserByIdAsync(string userId)
    {
        var filter = Builders<User>.Filter.Eq(u => u.Id, userId);
        return await _db.Users.Find(filter).FirstOrDefaultAsync();
    }

    public async Task UpdateProfileAsync(string userId, UpdateProfileRequest request)
    {
        var filter = Builders<User>.Filter.Eq(u => u.Id, userId);
        var update = Builders<User>.Update
            .Set(u => u.DisplayName, request.DisplayName)
            .Set(u => u.Profile.DietType, request.DietType)
            .Set(u => u.Profile.Budget, request.Budget);
        await _db.Users.UpdateOneAsync(filter, update);
    }

    public AuthResponse GenerateTokenForUser(User user)
    {
        var (token, expiresAt) = GenerateToken(user);
        return new AuthResponse
        {
            Token = token,
            UserId = user.Id,
            DisplayName = user.DisplayName,
            ExpiresAt = expiresAt,
            Role = user.Role
        };
    }

    private (string token, DateTime expiresAt) GenerateToken(User user)
    {
        var expiresAt = DateTime.UtcNow.AddHours(_jwtSettings.ExpiryHours);
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("displayName", user.DisplayName),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var tokenDescriptor = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials
        );

        var handler = new JwtSecurityTokenHandler();
        var tokenString = handler.WriteToken(tokenDescriptor);
        return (tokenString, expiresAt);
    }
}
