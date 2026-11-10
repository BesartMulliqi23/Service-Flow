namespace ServiceFlow.Api.Contracts.ServiceLocations;

public sealed record ServiceLocationLookupResponse(
    Guid Id,
    Guid CustomerId,
    string CustomerName,
    string Name,
    bool IsActive
);