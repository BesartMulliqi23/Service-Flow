using Microsoft.AspNetCore.Authentication;

namespace ServiceFlow.Api.Services.Authentication;

public interface IExternalAuthService
{
    AuthenticationProperties Challenge(string provider, string redirectUri);

    Task<ExternalAuthenticationResult> HandleCallbackAsync();
}