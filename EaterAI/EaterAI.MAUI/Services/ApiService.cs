using System.Net.Http.Json;
using System.Text.Json;

namespace EaterAI.MAUI.Services;

public abstract class ApiService
{
    protected readonly HttpClient _http;
    private readonly ISecureTokenStorage _tokenStorage;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private record ErrorResponse(string? Error);

    private static async Task ThrowIfNotSuccessAsync(HttpResponseMessage response)
    {
        if (response.IsSuccessStatusCode) return;
        var body = await response.Content.ReadAsStringAsync();
        try
        {
            var err = JsonSerializer.Deserialize<ErrorResponse>(body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            throw new InvalidOperationException(err?.Error ?? body);
        }
        catch (JsonException)
        {
            throw new InvalidOperationException(string.IsNullOrWhiteSpace(body) ? response.ReasonPhrase : body);
        }
    }

    protected ApiService(IHttpClientFactory factory, ISecureTokenStorage tokenStorage)
    {
        _http = factory.CreateClient("EaterAI");
        _tokenStorage = tokenStorage;
    }

    private async Task AttachTokenAsync()
    {
        _http.DefaultRequestHeaders.Authorization = null;
        var token = await _tokenStorage.GetTokenAsync();
        if (!string.IsNullOrEmpty(token))
        {
            _http.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        }
    }

    protected async Task<T?> GetAsync<T>(string endpoint)
    {
        await AttachTokenAsync();
        var response = await _http.GetAsync(endpoint);

        if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
        {
            await _tokenStorage.ClearTokenAsync();
            return default;
        }

        await ThrowIfNotSuccessAsync(response);
        return await response.Content.ReadFromJsonAsync<T>(JsonOptions);
    }

    protected async Task<TRes?> PostAsync<TReq, TRes>(string endpoint, TReq body)
    {
        await AttachTokenAsync();
        var response = await _http.PostAsJsonAsync(endpoint, body, JsonOptions);

        if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
        {
            await _tokenStorage.ClearTokenAsync();
            return default;
        }

        await ThrowIfNotSuccessAsync(response);
        return await response.Content.ReadFromJsonAsync<TRes>(JsonOptions);
    }

    protected async Task PutAsync<TReq>(string endpoint, TReq body)
    {
        await AttachTokenAsync();
        var response = await _http.PutAsJsonAsync(endpoint, body, JsonOptions);

        if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
        {
            await _tokenStorage.ClearTokenAsync();
            return;
        }

        await ThrowIfNotSuccessAsync(response);
    }

    protected async Task DeleteAsync(string endpoint)
    {
        await AttachTokenAsync();
        var response = await _http.DeleteAsync(endpoint);

        if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
        {
            await _tokenStorage.ClearTokenAsync();
            return;
        }

        await ThrowIfNotSuccessAsync(response);
    }
}
