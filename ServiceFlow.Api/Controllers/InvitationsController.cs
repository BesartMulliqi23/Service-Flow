using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ServiceFlow.Api.Contracts.Invitations;
using ServiceFlow.Api.Models;
using ServiceFlow.Api.Services.Invitations;

namespace ServiceFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = ApplicationRoles.Owner)]
public sealed class InvitationsController(
    IInvitationService invitationService,
    SignInManager<ApplicationUser> signInManager
) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> CreateInvitation(CreateInvitationRequest request, CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(request.Email) ||
            !new EmailAddressAttribute().IsValid(request.Email))
        {
            errors["email"] = ["A valid email address is required."];
        }

        if (string.IsNullOrWhiteSpace(request.Role))
        {
            errors["role"] = ["A role is required."];
        }

        if (errors.Count > 0)
        {
            return ValidationProblem(new ValidationProblemDetails(errors));
        }

        var result = await invitationService.CreateInvitationAsync(
            User, 
            request.Email.Trim(), 
            request.Role.Trim(), 
            cancellationToken
        );

        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                message = result.Error
            });
        }

        return NoContent();
    }

    [HttpGet("accept")]
    [AllowAnonymous]
    public async Task<IActionResult> AcceptInvitation([FromQuery] string token, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return BadRequest(new
            {
                message = "An invitation token is required."
            });
        }

        var result = await invitationService.GetInvitationAsync(token, cancellationToken);

        switch (result.Status)
        {
            case InvitationStatus.Success:
                return Ok(result.Invitation);
            case InvitationStatus.NotFound:
                return NotFound();
            case InvitationStatus.Expired:
                return StatusCode(StatusCodes.Status410Gone, new
                {
                    message = "This invitation has expired."
                });
            case InvitationStatus.Accepted:
                return StatusCode(StatusCodes.Status410Gone, new
                {
                    message = "This invitation has already been accepted."
                });
            default:
                throw new InvalidOperationException($"Unexpected invitation status: {result.Status}");
        }
    }

    [HttpPost("accept")]
    [AllowAnonymous]
    public async Task<IActionResult> CompleteInvitation(CompleteInvitationRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
        {
            return BadRequest(new
            {
                message = "An invitation token is required."
            });
        }

        if (string.IsNullOrWhiteSpace(request.DisplayName))
        {
            return BadRequest(new
            {
                message = "A display name is required."
            });
        }

        if (request.DisplayName.Length > 200)
        {
            return BadRequest(new
            {
                message = "Display name can't exceed 200 characters."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new
            {
                message = "A password is required."
            });
        }

        if (request.Password != request.ConfirmPassword)
        {
            return BadRequest(new
            {
                message = "Passwords do not match."
            });
        }

        var result = await invitationService.CompleteInvitationAsync(
            request.Token.Trim(),
            request.DisplayName.Trim(),
            request.Password,
            cancellationToken
        );

        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                message = result.Error
            });
        }

        await signInManager.SignInAsync(result.User!, isPersistent: false);

        return NoContent();
    }
}