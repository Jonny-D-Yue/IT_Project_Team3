using EaterAI.Shared.DTOs.Menu;

namespace EaterAI.MAUI.Services;

public interface IMenuApiService
{
    Task<List<RestaurantDto>> GetRestaurantsAsync();
    Task<List<MenuItemDto>> GetMenuItemsAsync(string restaurantId);
    Task<List<MenuItemDto>> FilterMenuAsync(MenuFilterRequest request);
    Task<MenuItemDto?> GetItemByIdAsync(string id);
}

public class MenuApiService : ApiService, IMenuApiService
{
    public MenuApiService(IHttpClientFactory factory, ISecureTokenStorage tokenStorage)
        : base(factory, tokenStorage)
    {
    }

    public async Task<List<RestaurantDto>> GetRestaurantsAsync()
        => await GetAsync<List<RestaurantDto>>("/api/menu/restaurants") ?? new List<RestaurantDto>();

    public async Task<List<MenuItemDto>> GetMenuItemsAsync(string restaurantId)
        => await GetAsync<List<MenuItemDto>>($"/api/menu/restaurants/{restaurantId}/items") ?? new List<MenuItemDto>();

    public async Task<List<MenuItemDto>> FilterMenuAsync(MenuFilterRequest request)
        => await PostAsync<MenuFilterRequest, List<MenuItemDto>>("/api/menu/filter", request) ?? new List<MenuItemDto>();

    public async Task<MenuItemDto?> GetItemByIdAsync(string id)
        => await GetAsync<MenuItemDto>($"/api/menu/items/{id}");
}
