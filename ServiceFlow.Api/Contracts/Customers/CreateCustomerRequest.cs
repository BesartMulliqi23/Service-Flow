namespace ServiceFlow.Api.Contracts.Customers;

public sealed record CreateCustomerRequest(
    string? Name,
    string? ContactName,
    string? Email,
    string? PhoneNumber,
    string? Notes
);