using EaterAI.Shared.DTOs.Menu;

namespace EaterAI.Shared.DTOs.Favorites;

public class FavoriteCollectionDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public List<string> MenuItemIds { get; set; } = new();
    public List<MenuItemDto> MenuItems { get; set; } = new();
}
