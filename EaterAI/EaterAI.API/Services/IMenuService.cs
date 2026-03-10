using EaterAI.API.Models;
using EaterAI.Shared.DTOs.Menu;

namespace EaterAI.API.Services;

public interface IMenuService
{
    Task<List<RestaurantDto>> GetRestaurantsAsync();
    Task<List<MenuItemDto>> GetMenuItemsAsync(string restaurantId);
    Task<List<MenuItemDto>> GetAllMenuItemsAsync();
    Task<List<MenuItemDto>> FilterMenuItemsAsync(MenuFilterRequest filter);
    Task<MenuItem?> GetMenuItemByIdAsync(string id);
    Task<MenuItemDto?> GetMenuItemDtoByIdAsync(string id);
    Task TriggerLogoGenerationAsync(IDishImageService dishImageService);
    Task TriggerDishImageGenerationAsync(string restaurantId, IDishImageService dishImageService);
}
