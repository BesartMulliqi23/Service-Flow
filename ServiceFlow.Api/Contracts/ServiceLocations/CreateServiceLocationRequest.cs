namespace ServiceFlow.Api.Contracts.ServiceLocations;

public sealed record CreateServiceLocationRequest(
    Guid CustomerId,
    string? Name,
    string? AddressLine1,
    string? AddressLine2,
    string? City,
    string? PostalCode,
    string? Country,
    string? AccessInstructions
);