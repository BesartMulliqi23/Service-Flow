using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using ServiceFlow.Api.Contracts.Invitations;
using ServiceFlow.Api.Data;
using ServiceFlow.Api.Models;
using ServiceFlow.Api.Services.Email;
using ServiceFlow.Api.Settings;

namespace ServiceFlow.Api.Services.Invitations;

public sealed class InvitationService(
    ApplicationDbContext dbContext,
    UserManager<ApplicationUser> userManager,
    IEmailSender emailSender,
    IOptions<FrontendOptions> frontendOptions
) : IInvitationService
{
    private readonly FrontendOptions _frontendOptions = frontendOptions.Value;

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

        var organizationName = await dbContext.Organizations
            .Where(o => o.Id == user.OrganizationId)
            .Select(o => o.Name)
            .SingleAsync(cancellationToken);

        await SendInvitationEmailAsync(invitation, organizationName, cancellationToken);

        return InvitationResult.Success();
    }

    public async Task<InvitationDetailsResult> GetInvitationAsync(string token, CancellationToken cancellationToken)
    {
        var invitation = await dbContext.Invitations
            .Include(i => i.Organization)
            .SingleOrDefaultAsync(i => i.Token == token, cancellationToken);

        if (invitation is null)
        {
            return InvitationDetailsResult.NotFound();
        }

        if (invitation.AcceptedUtc is not null)
        {
            return InvitationDetailsResult.Accepted();
        }

        if (invitation.ExpiresUtc < DateTime.UtcNow)
        {
            return InvitationDetailsResult.Expired();
        }

        var response = new InvitationDetailsResponse(invitation.Email, invitation.Organization.Name, invitation.Role);

        return  InvitationDetailsResult.Success(response);
    }

    public async Task<CompleteInvitationResult> CompleteInvitationAsync(
        string token, 
        string displayName, 
        string password,  
        CancellationToken cancellationToken
    )
    {
        var invitation = await dbContext.Invitations
            .SingleOrDefaultAsync(i => i.Token == token, cancellationToken);

        var validationError = ValidateInvitation(invitation);

        if (validationError is not null)
        {
            return CompleteInvitationResult.Failure(validationError);
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var user = CreateInvitationUser(invitation!, displayName);

        var createUserResult = await userManager.CreateAsync(user, password);

        if (!createUserResult.Succeeded)
        {
            return CompleteInvitationResult.Failure(string.Join(", ", createUserResult.Errors.Select(e => e.Description)));
        }

        var finalizeResult = await FinalizeInvitationAsync(invitation!, user, cancellationToken);

        if (finalizeResult is not null)
        {
            return finalizeResult;
        }

        await transaction.CommitAsync(cancellationToken);

        return CompleteInvitationResult.Success(user);
    }

    public async Task<CompleteInvitationResult> CompleteExternalInvitationAsync(
        Invitation invitation,
        ExternalLoginInfo externalLoginInfo,
        CancellationToken cancellationToken
    )
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var user = CreateInvitationUser(
            invitation, 
            externalLoginInfo.Principal.FindFirstValue(ClaimTypes.Name) ?? invitation.Email
        );

        var createUserResult = await userManager.CreateAsync(user);

        if (!createUserResult.Succeeded)
        {
            return CompleteInvitationResult.Failure(string.Join(", ", createUserResult.Errors.Select(e => e.Description)));
        }

        var addLoginResult = await userManager.AddLoginAsync(user, externalLoginInfo);

        if (!addLoginResult.Succeeded)
        {
            return CompleteInvitationResult.Failure(string.Join(", ", addLoginResult.Errors.Select(e => e.Description)));
        }

        var finalizeResult = await FinalizeInvitationAsync(invitation, user, cancellationToken);

        if (finalizeResult is not null)
        {
            return finalizeResult;
        }

        await transaction.CommitAsync(cancellationToken);

        return CompleteInvitationResult.Success(user);
    }

    public async Task<Invitation?> FindValidInvitationByTokenAsync(string token, CancellationToken cancellationToken)
    {
        var invitation = await dbContext.Invitations
            .SingleOrDefaultAsync(i => i.Token == token, cancellationToken);

        return ValidateInvitation(invitation) is null ? invitation : null;
    }

    private async Task SendInvitationEmailAsync(Invitation invitation, string organizationName, CancellationToken cancellationToken)
    {
        var invitationUrl = QueryHelpers.AddQueryString(
            $"{_frontendOptions.BaseUrl.TrimEnd('/')}/invitations/accept",
            new Dictionary<string, string?>
            {
                ["token"] = invitation.Token
            }
        );

        var encodedInvitationUrl = HtmlEncoder.Default.Encode(invitationUrl);

        var htmlBody = $"""
            <h1>You've been invited to ServiceFlow</h1>

            <p>
                You have been invited to join <strong>{organizationName}</strong> as <strong>{invitation.Role}</strong>.
            </p>

            <p>
                Click the button below to accept your invitation and finish creating your account.
            </p>

            <p>
                <a href="{encodedInvitationUrl}">Accept invitation</a>
            </p>

            <p>
                This invitation expires in 7 days 
                (on <strong>{invitation.ExpiresUtc:MMMM d, yyyy}</strong>).
            </p>
        """;

        await emailSender.SendAsync(
            invitation.Email, 
            "You're invited to join ServiceFlow", 
            htmlBody, 
            cancellationToken);
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

    private static string? ValidateInvitation(Invitation? invitation)
    {
        if (invitation is null)
        {
            return "Invalid invitation token.";
        }

        if (invitation.AcceptedUtc is not null)
        {
            return "This invitation has already been accepted.";
        }

        if (invitation.ExpiresUtc < DateTime.UtcNow)
        {
            return "This invitation has expired.";
        }

        return null;
    }

    private static ApplicationUser CreateInvitationUser(Invitation invitation, string displayName)
    {
        return new ApplicationUser
        {
            UserName = invitation.Email,
            Email = invitation.Email,
            EmailConfirmed = true,
            DisplayName = displayName,
            OrganizationId = invitation.OrganizationId
        };
    }

    private async Task<CompleteInvitationResult?> FinalizeInvitationAsync(
        Invitation invitation,
        ApplicationUser user,
        CancellationToken cancellationToken
    )
    {
        var addToRoleResult = await userManager.AddToRoleAsync(user, invitation.Role);

        if (!addToRoleResult.Succeeded)
        {
            return CompleteInvitationResult.Failure(string.Join(", ", addToRoleResult.Errors.Select(e => e.Description)));
        }

        invitation.AcceptedUtc = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        return null;
    } 
}