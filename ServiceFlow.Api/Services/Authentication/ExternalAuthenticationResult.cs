namespace ServiceFlow.Api.Services.Authentication;

public sealed record ExternalAuthenticationResult(
    ExternalAuthenticationStatus Status,
    string RedirectUri,
    string? Message = null
);