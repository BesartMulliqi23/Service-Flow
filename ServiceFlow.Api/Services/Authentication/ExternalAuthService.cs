using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using ServiceFlow.Api.Models;
using ServiceFlow.Api.Settings;

namespace ServiceFlow.Api.Services.Authentication;

public sealed class ExternalAuthService(
    SignInManager<ApplicationUser> signInManager
) : IExternalAuthService
{
    private HashSet<string> SupportedProviders = [
        GoogleDefaults.AuthenticationScheme
    ];

    public AuthenticationProperties Challenge(string provider, string redirectUri)
    {
        if (!SupportedProviders.Contains(provider))
        {
            throw new ArgumentException($"Unsupported authentication provider '{provider}'.", provider); 
        }

        return signInManager.ConfigureExternalAuthenticationProperties(provider, redirectUri);
    }

    public async Task<ExternalAuthenticationResult> HandleCallbackAsync()
    {
        var info = await signInManager.GetExternalLoginInfoAsync();

        if (info is null)
        {
            return new(
                ExternalAuthenticationStatus.AuthenticationFailed,
                "External login information could not be retrieved."
            );
        }

        throw new NotImplementedException();
    }
}