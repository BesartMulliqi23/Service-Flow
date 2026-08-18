using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Authorization;

public sealed class ApplicationUserClaimsPrincipalFactory(
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole> roleManager,
    IOptions<IdentityOptions> optionsAccessor
) : UserClaimsPrincipalFactory<ApplicationUser, IdentityRole>(userManager, roleManager, optionsAccessor)
{
    protected override async Task<ClaimsIdentity> GenerateClaimsAsync(ApplicationUser user)
    {
        var identity = await base.GenerateClaimsAsync(user);

        if (user.OrganizationId == Guid.Empty)
        {
            throw new InvalidOperationException("An authenticated user must belong to an organization.");
        }

        identity.AddClaim(new Claim(
            ServiceFlowClaimTypes.OrganizationId,
            user.OrganizationId.ToString("D")
        ));

        return identity;
    }
}