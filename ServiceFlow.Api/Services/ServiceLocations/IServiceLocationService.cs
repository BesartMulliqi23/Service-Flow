using ServiceFlow.Api.Contracts.Common;
using ServiceFlow.Api.Contracts.ServiceLocations;

namespace ServiceFlow.Api.Services.ServiceLocations;

public interface IServiceLocationService
{
    Task<CreateServiceLocationResult> CreateAsync(
        CreateServiceLocationRequest request,
        CancellationToken cancellationToken
    );

    Task<PagedResponse<ServiceLocationResponse>> GetAllAsync(
        string? search,
        Guid? customerId,
        bool includeInactive,
        int page,
        int pageSize,
        CancellationToken cancellationToken
    );

    Task<ServiceLocationResponse?> GetByIdAsync(
        Guid serviceLocationId,
        CancellationToken cancellationToken
    );

    Task<ServiceLocationResponse?> UpdateAsync(
        Guid serviceLocationId,
        UpdateServiceLocationRequest request,
        CancellationToken cancellationToken
    );

    Task<bool> DeactivateAsync(
        Guid serviceLocationId,
        CancellationToken cancellationToken
    );
}