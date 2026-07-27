namespace ServiceFlow.Api.Contracts.Authentication;

public sealed record CurrentUserResponse(
    string Id,
    string DisplayName,
    string Email,
    bool EmailConfirmed,
    IReadOnlyCollection<string> Roles 
);