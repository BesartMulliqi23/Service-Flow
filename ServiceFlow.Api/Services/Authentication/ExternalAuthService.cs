using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.MicrosoftAccount;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using ServiceFlow.Api.Data;
using ServiceFlow.Api.Models;
using ServiceFlow.Api.Services.OrganizationOnboarding;
using ServiceFlow.Api.Settings;

namespace ServiceFlow.Api.Services.Authentication;

public sealed class ExternalAuthService(
    SignInManager<ApplicationUser> signInManager,
    UserManager<ApplicationUser> userManager,
    IOptions<FrontendOptions> frontendOptions,
    //ApplicationDbContext dbContext,
    IOrganizationOnboardingService organizationOnboardingService
) : IExternalAuthService
{
    private static readonly HashSet<string> SupportedProviders = [
        GoogleDefaults.AuthenticationScheme,
        MicrosoftAccountDefaults.AuthenticationScheme
    ];

    private readonly FrontendOptions _frontendOptions = frontendOptions.Value;

    private string SuccessRedirect => $"{_frontendOptions.BaseUrl}/login/success";
    private string FailureRedirect => $"{_frontendOptions.BaseUrl}/login/error";
    private string ExternalOnboardingRedirect => $"{_frontendOptions.BaseUrl}/onboarding/external";

    public AuthenticationProperties Challenge(string provider, string redirectUri)
    {
        if (!SupportedProviders.Contains(provider))
        {
            throw new ArgumentException($"Unsupported authentication provider '{provider}'.", nameof(provider)); 
        }

        return signInManager.ConfigureExternalAuthenticationProperties(provider, redirectUri);
    }

    public async Task<ExternalAuthenticationResult> HandleCallbackAsync()
    {
        var info = await signInManager.GetExternalLoginInfoAsync();

        if (info is null)
        {
            return Failure(
                ExternalAuthenticationStatus.AuthenticationFailed, 
                "External login information could not be retrieved."
            );
        }

        var existingUserResult = await SignInExistingExternalUserAsync(info);

        if (existingUserResult is not null)
        {
            return existingUserResult;
        }

        var email = GetRequiredEmail(info);

        if (email is null)
        {
            return Failure(
                ExternalAuthenticationStatus.MissingEmail,
                "The external provider did not supply an email address."
            );
        }

        var existingUser = await userManager.FindByEmailAsync(email);

        if (existingUser is not null)
        {
            return await LinkExistingUserAsync(existingUser, info);
        }

        return HandleNewExternalUserAsync();
    }

    public async Task<ExternalAuthenticationResult> CompleteExternalOnboardingAsync(
        string organizationName, CancellationToken cancellationToken)
    {
        var info = await signInManager.GetExternalLoginInfoAsync();

        if (info is null)
        {
            return Failure(
                ExternalAuthenticationStatus.AuthenticationFailed,
                "The external authentication session could not be found."
            );
        }

        var email = GetRequiredEmail(info);

        if (email is null)
        {
            return Failure(
                ExternalAuthenticationStatus.MissingEmail,
                "The external provider did not supply an email address."
            );
        }

        var displayName = GetDisplayName(info) ?? email;

        var result = await organizationOnboardingService.CreateOrganizationOwnerAsync(
            email: email,
            displayName: displayName,
            organizationName: organizationName,
            password: null,
            externalLoginInfo: info,
            emailConfirmed: true,
            cancellationToken: cancellationToken
        );

        if (!result.Succeeded)
        {
            return Failure(
                ExternalAuthenticationStatus.AuthenticationFailed,
                "The external onboarding process could not be completed."
            );
        }

        await signInManager.SignInAsync(result.User!, isPersistent: false);

        return Success();
    }

    private async Task<ExternalAuthenticationResult?> SignInExistingExternalUserAsync(ExternalLoginInfo info)
    {
        var result = await signInManager.ExternalLoginSignInAsync(
            info.LoginProvider, 
            info.ProviderKey, 
            isPersistent: false,
            bypassTwoFactor: false
        );

        if (!result.Succeeded)
        {
            return null;
        }

        return Success();
    }

    private static string? GetRequiredEmail(ExternalLoginInfo info) 
    {
        return info.Principal.FindFirstValue(ClaimTypes.Email);
    }

    private static string? GetDisplayName(ExternalLoginInfo info)
    {
        return info.Principal.FindFirstValue(ClaimTypes.Name);
    }

    private async Task<ExternalAuthenticationResult> LinkExistingUserAsync(ApplicationUser user, ExternalLoginInfo info)
    {
        var linkResult = await userManager.AddLoginAsync(user, info);

        if (!linkResult.Succeeded)
        {
            return Failure(
                ExternalAuthenticationStatus.AuthenticationFailed,
                "The external account could not be linked."
            );
        }

        await signInManager.SignInAsync(user, isPersistent: false);

        return Success();
    }    

    private ExternalAuthenticationResult HandleNewExternalUserAsync()
    {
        return new ExternalAuthenticationResult(
            ExternalAuthenticationStatus.Success,
            ExternalOnboardingRedirect
        );
    }

    private ExternalAuthenticationResult Success()
    {
        return new ExternalAuthenticationResult(ExternalAuthenticationStatus.Success, SuccessRedirect);
    }

    private ExternalAuthenticationResult Failure(ExternalAuthenticationStatus status, string message)
    {
        return new ExternalAuthenticationResult(status, FailureRedirect, message);
    }
}