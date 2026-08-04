namespace ServiceFlow.Api.Contracts.Invitations;

public sealed record CompleteInvitationRequest(
    string Token,
    string DisplayName,
    string Password,
    string ConfirmPassword
);