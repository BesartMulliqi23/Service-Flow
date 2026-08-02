using System.Security.Claims;
using ServiceFlow.Api.Contracts.Invitations;

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
}