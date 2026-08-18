namespace ServiceFlow.Api.Contracts.Authentication;

public sealed record CurrentUserResponse(
    string Id,
    Guid OrganizationId,
    string DisplayName,
    string Email,
    bool EmailConfirmed,
    IReadOnlyCollection<string> Roles 
);