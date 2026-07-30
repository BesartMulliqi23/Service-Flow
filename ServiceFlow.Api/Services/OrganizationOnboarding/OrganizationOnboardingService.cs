using Microsoft.AspNetCore.Identity;
using ServiceFlow.Api.Data;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.OrganizationOnboarding;

public sealed class OrganizationOnboardingService(
    ApplicationDbContext dbContext,
    UserManager<ApplicationUser> userManager) : IOrganizationOnboardingService
{
    public async Task<OrganizationOnboardingResult> CreateOrganizationOwnerAsync(
        string email,
        string displayName,
        string organizationName,
        string? password,
        ExternalLoginInfo? externalLoginInfo,
        bool emailConfirmed,
        CancellationToken cancellationToken
    )
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var organization = new Organization
            {
                Name = organizationName,
                CreatedUtc = DateTime.UtcNow
            };

            dbContext.Organizations.Add(organization);

            var user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                DisplayName = displayName,
                Organization = organization,
                EmailConfirmed = emailConfirmed
            };

            IdentityResult createResult;

            if (password is not null)
            {
                createResult = await userManager.CreateAsync(user, password);
            }
            else
            {
                createResult = await userManager.CreateAsync(user);
            }

            if (!createResult.Succeeded)
            {
                return OrganizationOnboardingResult.Failure(ToErrors(createResult));
            }
            
            if (externalLoginInfo is not null)
            {
                var linkResult = await userManager.AddLoginAsync(user, externalLoginInfo);

                if (!linkResult.Succeeded)
                {
                    return OrganizationOnboardingResult.Failure(ToErrors(linkResult));
                }
            }

            var addRoleResult = await userManager.AddToRoleAsync(user, ApplicationRoles.Owner);

            if (!addRoleResult.Succeeded)
            {
                return OrganizationOnboardingResult.Failure(ToErrors(addRoleResult));
            }

            await transaction.CommitAsync(cancellationToken);

            return OrganizationOnboardingResult.Success(user);
        }
        catch
        {
            dbContext.ChangeTracker.Clear();
            throw;
        }
    }

    private static IReadOnlyDictionary<string, string[]> ToErrors(IdentityResult identityResult)
    {
        return identityResult.Errors
            .GroupBy(error => error.Code)
            .ToDictionary(
                group => group.Key,
                group => group.Select(error => error.Description).ToArray()
            );
    }
}