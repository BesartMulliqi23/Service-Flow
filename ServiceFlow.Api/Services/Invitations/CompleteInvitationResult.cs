using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.Invitations;

public sealed record CompleteInvitationResult(
    ApplicationUser? User,
    string? Error
)
{
    public bool Succeeded => Error is null;
    public static CompleteInvitationResult Success(ApplicationUser user) => new(user, null);
    public static CompleteInvitationResult Failure(string error) => new(null, error);
}