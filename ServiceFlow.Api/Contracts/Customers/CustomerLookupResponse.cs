namespace ServiceFlow.Api.Contracts.Customers;

public sealed record CustomerLookupResponse(
    Guid Id,
    string Name
);