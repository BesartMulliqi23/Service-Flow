namespace ServiceFlow.Api.Contracts.Invitations;

public sealed record CreateInvitationRequest(
    string Email,
    string Role
);