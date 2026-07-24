using System.ComponentModel.DataAnnotations;
using System.Text;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using ServiceFlow.Api.Contracts.Authentication;
using ServiceFlow.Api.Models;
using ServiceFlow.Api.Services.Email;
using ServiceFlow.Api.Settings;

namespace ServiceFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    IEmailSender emailSender,
    IOptions<FrontendOptions> frontendOptions,
    ILogger<AuthController> logger
) : ControllerBase
{
    private readonly FrontendOptions _frontendOptions = frontendOptions.Value;

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

    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status423Locked)]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken cancellationToken)
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

        if (errors.Count > 0)
        {
            return CreateValidationProblem(errors);
        }

        var result = await signInManager.PasswordSignInAsync(
            request.Email!.Trim(),
            request.Password!,
            request.RememberMe,
            lockoutOnFailure: true
        );

        if (result.Succeeded)
        {
            return NoContent();
        }

        if (result.IsLockedOut)
        {
            return Problem(
                title: "Account locked.",
                detail: "Too many unsuccessful sign-in attempts. Please try again later.",
                statusCode: StatusCodes.Status423Locked
            );
        }

        // Deliberately use the same response for an unknown email, an incorrect
        // password, and an unconfirmed account to avoid exposing account details.
        return Unauthorized(new
        {
            message = "Invalid email or password."
        });
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email) ||
            !new EmailAddressAttribute().IsValid(request.Email))
        {
            return CreateValidationProblem(new Dictionary<string, string[]>
            {
                ["email"] = ["A valid email address is required."]
            });
        }

        var user = await userManager.FindByEmailAsync(request.Email.Trim());

        if (user is not null && user.EmailConfirmed)
        {
            try
            {
                await SendPasswordResetEmailAsync(user, cancellationToken);
            }
            catch (Exception e)
            {
                logger.LogError(
                    e,
                    "Failed to send password reset email for user {UserId}.",
                    user.Id
                );
            }
        }

        // Always return the same result for valid email addresses.
        // This prevents callers from discovering whether an account exists.
        return Accepted();
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(request.UserId))
        {
            errors["UserId"] = ["A user ID is required."];
        }

        if (string.IsNullOrWhiteSpace(request.Token))
        {
            errors["token"] = ["A reset token is required."];
        }

        if (string.IsNullOrWhiteSpace(request.NewPassword))
        {
            errors["newPassword"] = ["A new password is required."];
        }

        if (request.NewPassword != request.ConfirmPassword)
        {
            errors["confirmPassword"] = ["Passwords do not match."];
        }

        if (errors.Count > 0)
        {
            return CreateValidationProblem(errors);
        }

        var user = await userManager.FindByIdAsync(request.UserId!);

        if (user is null)
        {
            return BadRequest(new
            {
                message = "The password reset request is invalid or has expired."
            });
        }

        string decodedToken;

        try
        {
            decodedToken = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(request.Token!));
        }
        catch (FormatException)
        {
            return BadRequest(new
            {
                message = "The password reset request is invalid or has expired."
            });
        }

        var result = await userManager.ResetPasswordAsync(user, decodedToken, request.NewPassword!);

        if (!result.Succeeded)
        {
            var identityErrors = result.Errors
                .GroupBy(e => e.Code)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(error => error.Description).ToArray()
                );

            return CreateValidationProblem(identityErrors);
        }

        await userManager.ResetAccessFailedCountAsync(user);
        await userManager.SetLockoutEndDateAsync(user, null);
        await signInManager.SignOutAsync();

        return NoContent();
    }

    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout()
    {
        await signInManager.SignOutAsync();

        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(CurrentUserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CurrentUserResponse>> GetCurrentUser()
    {
        var user = await userManager.GetUserAsync(User);

        if (user is null)
        {
            return Unauthorized();
        }

        var roles = await userManager.GetRolesAsync(user);

        return Ok(new CurrentUserResponse(
            user.Id,
            user.Email!,
            user.EmailConfirmed,
            roles.ToArray()
        ));
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

    private async Task SendPasswordResetEmailAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        var token = await userManager.GeneratePasswordResetTokenAsync(user);

        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

        var resetUrl = QueryHelpers.AddQueryString(
            $"{_frontendOptions.BaseUrl.TrimEnd('/')}/reset-password",
            new Dictionary<string, string?>
            {
                ["userId"] = user.Id,
                ["token"] = encodedToken
            }
        );

        var encodedResetUrl = HtmlEncoder.Default.Encode(resetUrl);

        var htmlBody = $"""
            <h1>Reset your ServiceFlow password</h1>
            <p>We received a request to reset your password.</p>
            <p>
                <a href="{encodedResetUrl}">
                    Reset your password
                </a>
            </p>
            <p>If you did not request a password reset, you can ignore this email.</p>
        """;

        await emailSender.SendAsync(
            user.Email!,
            "Reset your ServiceFlow password",
            htmlBody,
            cancellationToken
        );
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