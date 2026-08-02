namespace ServiceFlow.Api.Services.Invitations;

public sealed record CompleteInvitationResult(
    bool Succeeded,
    string? Error
)
{
    public static CompleteInvitationResult Success() => new(true, null);
    public static CompleteInvitationResult Failure(string error) => new(false, error);
}