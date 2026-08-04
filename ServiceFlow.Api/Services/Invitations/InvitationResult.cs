namespace ServiceFlow.Api.Services.Invitations;

public sealed record InvitationResult(
    bool Succeeded,
    string? Error = null
)
{
    public static InvitationResult Success() => new(true);
    public static InvitationResult Failure(string error) => new(false, error);
}