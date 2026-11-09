using ServiceFlow.Api.Contracts.Common;
using ServiceFlow.Api.Contracts.Materials;

namespace ServiceFlow.Api.Services.Materials;

public interface IMaterialCatalogService
{
    Task<MaterialCatalogMutationResult> CreateAsync(
        CreateMaterialRequest request,
        CancellationToken cancellationToken
    );

    Task<PagedResponse<MaterialResponse>> GetAllAsync(
        string? search,
        bool includeInactive,
        int page,
        int pageSize,
        CancellationToken cancellationToken
    );

    Task<IReadOnlyList<MaterialResponse>> GetActiveForTechnicianAsync(
        CancellationToken cancellationToken
    );

    Task<MaterialResponse?> GetByIdAsync(
        Guid materialId,
        CancellationToken cancellationToken
    );

    Task<MaterialCatalogMutationResult> UpdateAsync(
        Guid materialId,
        UpdateMaterialRequest request,
        CancellationToken cancellationToken
    );

    Task<MaterialCatalogMutationStatus> DeactiveAsync(
        Guid materialId,
        CancellationToken cancellationToken
    );
}