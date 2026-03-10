using EaterAI.API.Services;
using EaterAI.Shared.DTOs.Favorites;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EaterAI.API.Controllers;

[ApiController]
[Route("api/favorites")]
[Authorize]
public class FavoritesController : ControllerBase
{
    private readonly IFavoriteService _favoriteService;

    public FavoritesController(IFavoriteService favoriteService) => _favoriteService = favoriteService;

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)
                             ?? User.FindFirstValue("sub")
                             ?? string.Empty;

    [HttpGet("collections")]
    public async Task<IActionResult> GetCollections()
    {
        var collections = await _favoriteService.GetCollectionsAsync(UserId);
        return Ok(collections);
    }

    [HttpPost("collections")]
    public async Task<IActionResult> CreateCollection([FromBody] CreateCollectionRequest request)
    {
        var collection = await _favoriteService.CreateCollectionAsync(UserId, request.Name);
        return CreatedAtAction(nameof(GetCollections), collection);
    }

    [HttpPost("collections/{id}/items")]
    public async Task<IActionResult> AddItem(string id, [FromBody] AddFavoriteRequest request)
    {
        await _favoriteService.AddItemAsync(UserId, id, request.MenuItemId);
        return Ok(new { success = true });
    }

    [HttpDelete("collections/{id}/items/{itemId}")]
    public async Task<IActionResult> RemoveItem(string id, string itemId)
    {
        await _favoriteService.RemoveItemAsync(UserId, id, itemId);
        return Ok(new { success = true });
    }
}
