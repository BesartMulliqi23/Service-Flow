using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceFlow.Api.Contracts.Notifications;
using ServiceFlow.Api.Services.Notifications;

namespace ServiceFlow.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public sealed class NotificationsController(
    INotificationService notificationService
) : ControllerBase
{
    private const int DefaultTake = 20;
    private const int MaximumTake = 50;

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<WorkOrderNotificationResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<WorkOrderNotificationResponse>>> GetAll(
        [FromQuery] int? take,
        CancellationToken cancellationToken
    )
    {
        var normalizedTake = Math.Clamp(
            take ?? DefaultTake,
            1,
            MaximumTake
        );

        var notifications = await notificationService.GetForCurrentUserAsync(normalizedTake, cancellationToken);

        return Ok(notifications);
    }

    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(UnreadNotificationCountResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<UnreadNotificationCountResponse>> GetUnreadCount(
        CancellationToken cancellationToken
    )
    {
        var unreadCount = await notificationService.GetUnreadCountForCurrentUserAsync(cancellationToken);

        return Ok(new UnreadNotificationCountResponse(unreadCount));
    }

    [HttpPost("{notificationId:guid}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkRead(
        Guid notificationId,
        CancellationToken cancellationToken
    )
    {
        var markedRead = await notificationService.MarkReadAsync(notificationId, cancellationToken);

        return markedRead ? NoContent() : NotFound();
    }

    [HttpPost("read-all")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkAllRead(
        CancellationToken cancellationToken
    )
    {
        await notificationService.MarkAllReadAsync(cancellationToken);

        return NoContent();
    }
}