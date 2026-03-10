using EaterAI.Shared.DTOs.Favorites;

namespace EaterAI.API.Services;

public interface IFavoriteService
{
    Task<List<FavoriteCollectionDto>> GetCollectionsAsync(string userId);
    Task<FavoriteCollectionDto> CreateCollectionAsync(string userId, string name);
    Task AddItemAsync(string userId, string collectionId, string menuItemId);
    Task RemoveItemAsync(string userId, string collectionId, string menuItemId);
}
