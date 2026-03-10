using EaterAI.API.Services;
using EaterAI.Shared.DTOs.Menu;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EaterAI.API.Controllers;

[ApiController]
[Route("api/menu")]
[Authorize]
public class MenuController : ControllerBase
{
    private readonly IMenuService _menuService;
    private readonly IDishImageService _dishImageService;

    public MenuController(IMenuService menuService, IDishImageService dishImageService)
    {
        _menuService = menuService;
        _dishImageService = dishImageService;
    }

    [HttpGet("restaurants")]
    public async Task<IActionResult> GetRestaurants()
    {
        var restaurants = await _menuService.GetRestaurantsAsync();
        // Trigger background logo generation for any restaurant missing a logo
        _ = _menuService.TriggerLogoGenerationAsync(_dishImageService);
        return Ok(restaurants);
    }

    [HttpGet("restaurants/{id}/items")]
    public async Task<IActionResult> GetMenuItems(string id)
    {
        var items = await _menuService.GetMenuItemsAsync(id);
        // Trigger background image generation for any item missing an image
        _ = _menuService.TriggerDishImageGenerationAsync(id, _dishImageService);
        return Ok(items);
    }

    [HttpGet("items/{id}")]
    public async Task<IActionResult> GetItemById(string id)
    {
        var item = await _menuService.GetMenuItemDtoByIdAsync(id);
        if (item is null) return NotFound();
        return Ok(item);
    }

    [HttpPost("filter")]
    public async Task<IActionResult> FilterItems([FromBody] MenuFilterRequest request)
    {
        var items = await _menuService.FilterMenuItemsAsync(request);
        return Ok(items);
    }
}
