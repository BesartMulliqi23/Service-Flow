using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using ServiceFlow.Api.Data;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.Invitations;

public sealed class InvitationService(
    ApplicationDbContext dbContext,
    UserManager<ApplicationUser> userManager
) : IInvitationService
{
    public async Task<InvitationResult> CreateInvitationAsync(
        ClaimsPrincipal principal,
        string email,
        string role,
        CancellationToken cancellationToken
    )
    {
        if (!IsValidRole(role))
        {
            return InvitationResult.Failure("Invalid role.");
        }

        var user = await userManager.GetUserAsync(principal);

        if (user is null)
        {
            return InvitationResult.Failure("The current user could not be found.");
        }

        var existingUser = await userManager.FindByEmailAsync(email);

        if (existingUser is not null && existingUser.OrganizationId == user.OrganizationId)
        {
            return InvitationResult.Failure("This user already belongs to your organization.");
        }

        var invitation = await dbContext.Invitations
            .FirstOrDefaultAsync(i => i.OrganizationId == user.OrganizationId && i.Email == email, cancellationToken);

        var now = DateTime.UtcNow;

        if (invitation is null)
        {
            invitation = new Invitation
            {
                OrganizationId = user.OrganizationId
            };

            dbContext.Invitations.Add(invitation);
        }

        invitation.Email = email;
        invitation.Role = role;
        invitation.Token = GenerateToken();
        invitation.CreatedUtc = now;
        invitation.ExpiresUtc = now.AddDays(7);
        invitation.AcceptedUtc = null;

        await dbContext.SaveChangesAsync(cancellationToken);

        return InvitationResult.Success();
    }

    private static string GenerateToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);

        return WebEncoders.Base64UrlEncode(bytes);
    }

    private static bool IsValidRole(string role)
    {
        return ApplicationRoles.All.Contains(role);
    }
}