using EaterAI.API.Services;
using EaterAI.Shared.DTOs.Chat;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EaterAI.API.Controllers;

[ApiController]
[Route("api/chat")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;

    public ChatController(IChatService chatService) => _chatService = chatService;

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)
                             ?? User.FindFirstValue("sub")
                             ?? string.Empty;

    [HttpPost("send")]
    public async Task<IActionResult> Send([FromBody] ChatRequest request)
    {
        var response = await _chatService.SendMessageAsync(UserId, request);
        return Ok(response);
    }

    [HttpGet("history/{sessionId}")]
    public async Task<IActionResult> GetHistory(string sessionId)
    {
        var messages = await _chatService.GetHistoryAsync(UserId, sessionId);
        return Ok(messages);
    }

    [HttpGet("sessions")]
    public async Task<IActionResult> GetSessions()
    {
        var sessions = await _chatService.GetSessionsAsync(UserId);
        return Ok(sessions);
    }
}
