namespace ServiceFlow.Api.Contracts.Technicians;

public sealed record TechnicianResponse(
    string Id,
    string DisplayName,
    string Email
);