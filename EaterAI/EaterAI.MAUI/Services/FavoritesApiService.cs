using EaterAI.Shared.DTOs.Favorites;

namespace EaterAI.MAUI.Services;

public interface IFavoritesApiService
{
    Task<List<FavoriteCollectionDto>> GetCollectionsAsync();
    Task<FavoriteCollectionDto?> CreateCollectionAsync(string name);
    Task AddItemAsync(string collectionId, string menuItemId);
    Task RemoveItemAsync(string collectionId, string menuItemId);
}

public class FavoritesApiService : ApiService, IFavoritesApiService
{
    public FavoritesApiService(IHttpClientFactory factory, ISecureTokenStorage tokenStorage)
        : base(factory, tokenStorage)
    {
    }

    public async Task<List<FavoriteCollectionDto>> GetCollectionsAsync()
        => await GetAsync<List<FavoriteCollectionDto>>("/api/favorites/collections") ?? new List<FavoriteCollectionDto>();

    public Task<FavoriteCollectionDto?> CreateCollectionAsync(string name)
    {
        var request = new CreateCollectionRequest { Name = name };
        return PostAsync<CreateCollectionRequest, FavoriteCollectionDto>("/api/favorites/collections", request);
    }

    public async Task AddItemAsync(string collectionId, string menuItemId)
    {
        var request = new AddFavoriteRequest { MenuItemId = menuItemId };
        await PostAsync<AddFavoriteRequest, object>($"/api/favorites/collections/{collectionId}/items", request);
    }

    public Task RemoveItemAsync(string collectionId, string menuItemId)
        => DeleteAsync($"/api/favorites/collections/{collectionId}/items/{menuItemId}");
}
