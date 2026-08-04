using Microsoft.AspNetCore.Authentication;

namespace ServiceFlow.Api.Services.Authentication;

public interface IExternalAuthService
{
    AuthenticationProperties Challenge(
        string provider, 
        string redirectUri,
        IDictionary<string, string?>? items = null
    );

    Task<ExternalAuthenticationResult> HandleCallbackAsync(CancellationToken cancellationToken);

    Task<ExternalAuthenticationResult> CompleteExternalOnboardingAsync(
        string organizationName, CancellationToken cancellationToken);
}