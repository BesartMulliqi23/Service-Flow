using System.Security.Claims;

namespace ServiceFlow.Api.Authorization;

public sealed class CurrentOrganization(
    IHttpContextAccessor httpContextAccessor
) : ICurrentOrganization
{
    public string UserId => GetRequiredClaim(ClaimTypes.NameIdentifier);

    public Guid OrganizationId
    {
        get
        {
            var value = GetRequiredClaim(ServiceFlowClaimTypes.OrganizationId);

            if (!Guid.TryParse(value, out var organizationId))
            {
                throw new InvalidOperationException("The authenticated user has an invalid organization claim.");
            }

            return organizationId;
        }
    }

    private string GetRequiredClaim(string claimType)
    {
        var user = httpContextAccessor.HttpContext?.User;

        if (user?.Identity?.IsAuthenticated != true)
        {
            throw new InvalidOperationException("A current organization requires an authenticated user.");
        }

        return user.FindFirst(claimType)?.Value
            ?? throw new InvalidOperationException($"The authenticated user is missing the '{claimType}' claim.");
    }
}