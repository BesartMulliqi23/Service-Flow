namespace ServiceFlow.Api.Contracts.Authentication;

public sealed record RegisterRequest(
    string? Email,
    string? DisplayName,
    string? OrganizationName,
    string? Password,
    string? ConfirmPassword
);