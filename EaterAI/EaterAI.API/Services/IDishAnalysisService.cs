using EaterAI.Shared.DTOs.Manager;

namespace EaterAI.API.Services;

public interface IDishAnalysisService
{
    Task<AnalyzeDishResponse> AnalyzeOnlyAsync(AnalyzeDishRequest request);
    Task<string> SaveDishAsync(SaveDishRequest request);
}
