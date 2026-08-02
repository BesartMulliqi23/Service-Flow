using System.Security.Claims;

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
}