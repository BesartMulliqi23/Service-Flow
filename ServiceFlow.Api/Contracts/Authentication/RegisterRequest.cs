namespace ServiceFlow.Api.Contracts.Authentication;

public sealed record RegisterRequest(
    string? Email,
    string? Password,
    string? ConfirmPassword
);