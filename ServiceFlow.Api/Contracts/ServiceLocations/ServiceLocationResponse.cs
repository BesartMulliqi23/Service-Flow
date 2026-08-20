namespace ServiceFlow.Api.Contracts.ServiceLocations;

public sealed record ServiceLocationResponse(
    Guid Id,
    Guid CustomerId,
    string CustomerName,
    string Name,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string? PostalCode,
    string Country,
    string? AccessInstructions,
    bool IsActive,
    DateTime CreatedUtc,
    DateTime? UpdatedUtc
);