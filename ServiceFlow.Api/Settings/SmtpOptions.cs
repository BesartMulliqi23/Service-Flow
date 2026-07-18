namespace ServiceFlow.Api.Settings;

public sealed class SmtpOptions
{
    public const string SectionName = "Smtp";
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; }
    public string FromName { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public bool UseStartTls { get; set; }
    public string? UserName { get; set; }
    public string? Password { get; set; }
}