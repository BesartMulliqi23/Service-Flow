namespace ServiceFlow.Api.Settings;

public sealed class MicrosoftAuthenticationOptions
{
    public const string SectionName = "Authentication:Microsoft";
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
}