using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.OrganizationOnboarding;

public sealed record OrganizationOnboardingResult(
    ApplicationUser? User,
    IReadOnlyDictionary<string, string[]> Errors
)
{
    public bool Succeeded => Errors.Count == 0;

    public static OrganizationOnboardingResult Success(ApplicationUser user) 
        => new(user, new Dictionary<string, string[]>());

    public static OrganizationOnboardingResult Failure(IReadOnlyDictionary<string, string[]> errors) 
        => new(null, errors);
}