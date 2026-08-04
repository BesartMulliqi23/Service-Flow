using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using ServiceFlow.Api.Contracts.Invitations;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.Invitations;

public interface IInvitationService
{
    Task<InvitationResult> CreateInvitationAsync(
        ClaimsPrincipal principal,
        string email,
        string role,
        CancellationToken cancellationToken
    );

    Task<InvitationDetailsResult> GetInvitationAsync(
        string token, 
        CancellationToken cancellationToken
    );

    Task<CompleteInvitationResult> CompleteInvitationAsync(
        string token,
        string displayName,
        string password,
        CancellationToken cancellationToken
    );

    Task<CompleteInvitationResult> CompleteExternalInvitationAsync(
        Invitation invitation,
        ExternalLoginInfo externalLoginInfo,
        CancellationToken cancellationToken
    );

    Task<Invitation?> FindValidInvitationByTokenAsync(string token, CancellationToken cancellationToken);
}