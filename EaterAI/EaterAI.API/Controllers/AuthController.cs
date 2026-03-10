using EaterAI.API.Services;
using EaterAI.Shared.DTOs.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EaterAI.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IVoiceLoginService _voiceLogin;

    public AuthController(IAuthService authService, IVoiceLoginService voiceLogin)
    {
        _authService = authService;
        _voiceLogin = voiceLogin;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var response = await _authService.RegisterAsync(request);
        return Ok(response);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var response = await _authService.LoginAsync(request);
        return Ok(response);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub")
                     ?? string.Empty;
        var user = await _authService.GetUserByIdAsync(userId);
        if (user == null) return NotFound();
        return Ok(new { user.Id, user.Email, user.DisplayName, user.Profile });
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub")
                     ?? string.Empty;
        await _authService.UpdateProfileAsync(userId, request);
        return NoContent();
    }

    // ── Voice login endpoints ────────────────────────────────────────────────

    [Authorize]
    [HttpPost("voice/enroll")]
    public async Task<IActionResult> VoiceEnroll([FromBody] VoiceEnrollRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub")
                     ?? string.Empty;
        var result = await _voiceLogin.EnrollSampleAsync(userId, request.AudioBase64, request.SampleIndex);
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpPost("voice/identify")]
    public async Task<IActionResult> VoiceIdentify([FromBody] VoiceIdentifyRequest request)
    {
        var (userId, displayName, confidence) = await _voiceLogin.IdentifyAsync(request.AudioBase64);

        if (userId is null)
            return Ok(new VoiceIdentifyResponse { Matched = false, Confidence = confidence });

        var user = await _authService.GetUserByIdAsync(userId);
        if (user is null)
            return Ok(new VoiceIdentifyResponse { Matched = false, Confidence = confidence });

        var auth = _authService.GenerateTokenForUser(user);
        return Ok(new VoiceIdentifyResponse
        {
            Matched     = true,
            Token       = auth.Token,
            UserId      = auth.UserId,
            DisplayName = auth.DisplayName,
            ExpiresAt   = auth.ExpiresAt,
            Confidence  = confidence,
            Role        = auth.Role
        });
    }

    [Authorize]
    [HttpGet("voice/status")]
    public async Task<IActionResult> VoiceStatus()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub")
                     ?? string.Empty;
        var user = await _authService.GetUserByIdAsync(userId);
        return Ok(new { hasVoicePrint = user?.HasVoicePrint ?? false });
    }
}
