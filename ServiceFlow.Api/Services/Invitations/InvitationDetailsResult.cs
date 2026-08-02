using ServiceFlow.Api.Contracts.Invitations;

namespace ServiceFlow.Api.Services.Invitations;

public sealed record InvitationDetailsResult(
    InvitationDetailsResponse? Invitation,
    InvitationStatus Status 
)
{
    public static InvitationDetailsResult NotFound() => new(null, InvitationStatus.NotFound);

    public static InvitationDetailsResult Success(InvitationDetailsResponse response) => 
        new(response, InvitationStatus.Success);

    public static InvitationDetailsResult Expired() => new(null, InvitationStatus.Expired);

    public static InvitationDetailsResult Accepted() => new(null, InvitationStatus.Accepted);
}