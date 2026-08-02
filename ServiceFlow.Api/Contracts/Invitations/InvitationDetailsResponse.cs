namespace ServiceFlow.Api.Contracts.Invitations;

public sealed record InvitationDetailsResponse(
    string Email,
    string OrganizationName,
    string Role
);