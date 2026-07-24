namespace ServiceFlow.Api.Settings;

public sealed class GoogleAuthenticationOptions
{
    public const string SectionName = "Authentication:Google";
    public string ClientId { get; init; } = string.Empty;
    public string ClientSecret { get; init; } = string.Empty;
}