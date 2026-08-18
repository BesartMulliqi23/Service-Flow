namespace ServiceFlow.Api.Contracts.Customers;

public sealed record CustomerResponse(
    Guid Id,
    string Name,
    string? ContactName,
    string? Email,
    string? PhoneNumber,
    string? Notes,
    bool IsActive,
    DateTime CreatedUtc,
    DateTime? UpdatedUtc
);