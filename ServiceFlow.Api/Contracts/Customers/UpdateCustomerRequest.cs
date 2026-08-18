namespace ServiceFlow.Api.Contracts.Customers;

public sealed record UpdateCustomerRequest(
    string? Name,
    string? ContactName,
    string? Email,
    string? PhoneNumber,
    string? Notes
);