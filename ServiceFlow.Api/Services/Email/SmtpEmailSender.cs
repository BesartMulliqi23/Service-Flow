using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using ServiceFlow.Api.Settings;

namespace ServiceFlow.Api.Services.Email;

public sealed class SmtpEmailSender : IEmailSender
{
    public SmtpEmailSender(IOptions<SmtpOptions> smtpOptions)
    {
        _smtpOptions = smtpOptions.Value;
    }
    private readonly SmtpOptions _smtpOptions;

    public async Task SendAsync(
        string recipientEmail,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken = default 
    )
    {
        var message = new MimeMessage();

        message.From.Add(new MailboxAddress(_smtpOptions.FromName, _smtpOptions.FromEmail));

        message.To.Add(MailboxAddress.Parse(recipientEmail));
        message.Subject = subject;
        message.Body = new BodyBuilder
        {
          HtmlBody = htmlBody  
        }.ToMessageBody();

        using var client = new SmtpClient();

        var socketOptions = _smtpOptions.UseStartTls ? 
            SecureSocketOptions.StartTlsWhenAvailable : SecureSocketOptions.None;

        await client.ConnectAsync(
            _smtpOptions.Host,
            _smtpOptions.Port,
            socketOptions,
            cancellationToken
        );

        if (!string.IsNullOrEmpty(_smtpOptions.UserName))
        {
            await client.AuthenticateAsync(
                _smtpOptions.UserName,
                _smtpOptions.Password ?? string.Empty,
                cancellationToken
            );
        }

        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
    }
}