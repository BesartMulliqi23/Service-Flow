using System.ComponentModel.DataAnnotations;
using System.Text;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using ServiceFlow.Api.Contracts.Authentication;
using ServiceFlow.Api.Models;
using ServiceFlow.Api.Services.Email;

namespace ServiceFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController(
    UserManager<ApplicationUser> userManager,
    IEmailSender emailSender,
    ILogger<AuthController> logger
) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(request.Email) ||
            !new EmailAddressAttribute().IsValid(request.Email))
        {
            errors["email"] = ["A valid email address is required."];
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            errors["password"] = ["A password is required."];
        }

        if (request.Password != request.ConfirmPassword)
        {
            errors["confirmPassword"] = ["Passwords do not match."];
        }

        if (errors.Count > 0)
        {
            return CreateValidationProblem(errors);
        }

        var email = request.Email!.Trim();
        var user = await userManager.FindByEmailAsync(email);

        if (user is null)
        {
            user = new ApplicationUser
            {
                UserName = email,
                Email = email
            };

            var createResult = await userManager.CreateAsync(
                user,
                request.Password!);

            if (!createResult.Succeeded)
            {
                var identityErrors = createResult.Errors
                    .GroupBy(error => error.Code)
                    .ToDictionary(
                        group => group.Key,
                        group => group.Select(error => error.Description).ToArray()
                    );

                return CreateValidationProblem(identityErrors);
            }
        }

        if (!user.EmailConfirmed)
        {
            try
            {
                await SendConfirmationEmailAsync(
                    user,
                    cancellationToken
                );
            }
            catch (Exception exception)
            {
                logger.LogError(
                    exception,
                    "Failed to send email confirmation message for user {UserId}.",
                    user.Id
                );

                return Problem(
                    title: "Email delivery failed.",
                    detail: "The account was created, but the confirmation email could not be sent.",
                    statusCode: StatusCodes.Status503ServiceUnavailable
                );
            }
        }

        return Accepted();
    }

    [HttpGet("confirm-email")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ConfirmEmail([FromQuery] string userId, [FromQuery] string token)
    {
        var user = await userManager.FindByIdAsync(userId);

        if (user is null)
        {
            return BadRequest(new
            {
                message = "The email confirmation link is invalid."
            });
        }

        string decodedToken;

        try
        {
            decodedToken = Encoding.UTF8.GetString(
                WebEncoders.Base64UrlDecode(token));
        }
        catch (FormatException)
        {
            return BadRequest(new
            {
                message = "The email confirmation link is invalid."
            });
        }

        var result = await userManager.ConfirmEmailAsync(user, decodedToken);

        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                message = "The email confirmation link is invalid or expired."
            });
        }

        return Ok(new
        {
            message = "Email confirmed successfully. You can now sign in."
        });
    }

    private async Task SendConfirmationEmailAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        var token = await userManager.GenerateEmailConfirmationTokenAsync(user);

        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

        var confirmationUrl = Url.ActionLink(
            action: nameof(ConfirmEmail),
            controller: "Auth",
            values: new
            {
                userId = user.Id,
                token = encodedToken
            },
            protocol: Request.Scheme
        );

        if (confirmationUrl is null)
        {
            throw new InvalidOperationException("Could not generate the email confirmation URL.");
        }

        var encodedConfirmationUrl = HtmlEncoder.Default.Encode(confirmationUrl);

        var htmlBody = $"""
            <h1>Confirm your ServiceFlow account</h1>
            <p>Thanks for creating a ServiceFlow account.</p>
            <p>
                <a href="{encodedConfirmationUrl}">
                    Confirm your email address
                </a>
            </p>
            <p>If you did not create this account, you can ignore this email.</p>
            """;

        await emailSender.SendAsync(
            user.Email!,
            "Confirm your ServiceFlow account",
            htmlBody,
            cancellationToken
        );
    }

    private IActionResult CreateValidationProblem(IReadOnlyDictionary<string, string[]> errors)
    {
        foreach (var (key, messages) in errors)
        {
            foreach (var message in messages)
            {
                ModelState.AddModelError(key, message);
            }
        }

        return ValidationProblem(ModelState);
    }
} 