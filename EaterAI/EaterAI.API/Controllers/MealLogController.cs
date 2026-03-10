using EaterAI.API.Services;
using EaterAI.Shared.DTOs.Meal;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EaterAI.API.Controllers;

[ApiController]
[Route("api/meals")]
[Authorize]
public class MealLogController : ControllerBase
{
    private readonly IMealLogService _mealLogService;

    public MealLogController(IMealLogService mealLogService) => _mealLogService = mealLogService;

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)
                             ?? User.FindFirstValue("sub")
                             ?? string.Empty;

    [HttpPost("log")]
    public async Task<IActionResult> Log([FromBody] LogMealRequest request)
    {
        await _mealLogService.LogMealAsync(UserId, request.MenuItemId);
        return Ok(new { success = true });
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] int limit = 50)
    {
        var logs = await _mealLogService.GetHistoryAsync(UserId, limit);
        return Ok(logs);
    }

    [HttpGet("stats/weekly")]
    public async Task<IActionResult> GetWeeklyStats()
    {
        var stats = await _mealLogService.GetWeeklyStatsAsync(UserId);
        return Ok(stats);
    }
}
