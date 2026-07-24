namespace ServiceFlow.Api.Services.Authentication;

public sealed record ExternalAuthenticationResult(
    ExternalAuthenticationStatus Status,
    string? Message = null
);