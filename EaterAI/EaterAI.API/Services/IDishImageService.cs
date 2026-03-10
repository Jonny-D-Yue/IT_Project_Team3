using EaterAI.API.Models;

namespace EaterAI.API.Services;

public interface IDishImageService
{
    Task<string?> EnsureDishImageAsync(MenuItem dish);
    Task<string?> EnsureRestaurantLogoAsync(Restaurant restaurant);
}
