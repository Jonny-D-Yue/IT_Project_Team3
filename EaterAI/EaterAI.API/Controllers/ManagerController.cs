using EaterAI.API.Services;
using EaterAI.Shared.DTOs.Manager;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EaterAI.API.Controllers;

[ApiController]
[Route("api/manager")]
[Authorize(Roles = "Manager")]
public class ManagerController(IDishAnalysisService dishAnalysis, IMenuService menuService) : ControllerBase
{
    [HttpPost("analyze-dish")]
    public async Task<IActionResult> AnalyzeDish([FromBody] AnalyzeDishRequest req)
    {
        var result = await dishAnalysis.AnalyzeOnlyAsync(req);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("save-dish")]
    public async Task<IActionResult> SaveDish([FromBody] SaveDishRequest req)
    {
        var id = await dishAnalysis.SaveDishAsync(req);
        return Ok(new { menuItemId = id });
    }

    [HttpGet("dishes")]
    public async Task<IActionResult> GetAllDishes()
    {
        var items = await menuService.GetAllMenuItemsAsync();
        return Ok(items);
    }

    [HttpGet("dishes/{id}")]
    public async Task<IActionResult> GetDish(string id)
    {
        var item = await menuService.GetMenuItemDtoByIdAsync(id);
        if (item is null) return NotFound();
        return Ok(item);
    }
}
