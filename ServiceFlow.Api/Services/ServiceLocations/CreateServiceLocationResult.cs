using ServiceFlow.Api.Contracts.ServiceLocations;

namespace ServiceFlow.Api.Services.ServiceLocations;

public sealed record CreateServiceLocationResult(
    CreateServiceLocationStatus Status,
    ServiceLocationResponse? ServiceLocation
);