using Microsoft.AspNetCore.Identity;

namespace ServiceFlow.Api.Services.OrganizationOnboarding;

public interface IOrganizationOnboardingService
{
    Task<OrganizationOnboardingResult> CreateOrganizationOwnerAsync(
        string email,
        string displayName,
        string organizationName,
        string? password,
        ExternalLoginInfo? externalLoginInfo,
        bool emailConfirmed,
        CancellationToken cancellationToken
    );
}