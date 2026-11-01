using Microsoft.EntityFrameworkCore;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.Notifications;
using ServiceFlow.Api.Data;

namespace ServiceFlow.Api.Services.Notifications;

public sealed class NotificationService(
    ApplicationDbContext dbContext,
    ICurrentOrganization currentOrganization
) : INotificationService
{
    public async Task<IReadOnlyList<WorkOrderNotificationResponse>> GetForCurrentUserAsync(
        int take, 
        CancellationToken cancellationToken
    )
    {
        var organizationId = currentOrganization.OrganizationId;
        var userId = currentOrganization.UserId;

        return await dbContext.WorkOrderNotifications
            .AsNoTracking()
            .Where(
                notification =>
                    notification.OrganizationId == organizationId &&
                    notification.RecipientUserId == userId
            )
            .OrderByDescending(notification => notification.CreatedUtc)
            .Take(take)
            .Select(notification => new WorkOrderNotificationResponse(
                notification.Id,
                notification.WorkOrderId,
                notification.Type,
                notification.Title,
                notification.Message,
                notification.ScheduledStartUtc,
                notification.CreatedUtc,
                notification.ReadUtc.HasValue
            ))
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetUnreadCountForCurrentUserAsync(CancellationToken cancellationToken)
    {
        var organizationId = currentOrganization.OrganizationId;
        var userId = currentOrganization.UserId;

        return await dbContext.WorkOrderNotifications
            .CountAsync(
                notification =>
                    notification.OrganizationId == organizationId &&
                    notification.RecipientUserId == userId &&
                    !notification.ReadUtc.HasValue,
                cancellationToken
            );
    }

    public async Task<bool> MarkReadAsync(Guid notificationId, CancellationToken cancellationToken)
    {
        var organizationId = currentOrganization.OrganizationId;
        var userId = currentOrganization.UserId;

        var notification = await dbContext.WorkOrderNotifications
            .SingleOrDefaultAsync(
                notification =>
                    notification.Id == notificationId &&
                    notification.OrganizationId == organizationId &&
                    notification.RecipientUserId == userId,
                cancellationToken
            );

        if (notification is null)
        {
            return false;
        }

        if (!notification.ReadUtc.HasValue)
        {
            notification.ReadUtc = DateTime.UtcNow;

            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return true;
    }

    public async Task<int> MarkAllReadAsync(CancellationToken cancellationToken)
    {
        var organizationId = currentOrganization.OrganizationId;
        var userId = currentOrganization.UserId;
        var now = DateTime.UtcNow;

        return await dbContext.WorkOrderNotifications
            .Where(
                notification =>
                    notification.OrganizationId == organizationId &&
                    notification.RecipientUserId == userId &&
                    !notification.ReadUtc.HasValue
            )
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(
                    notification => notification.ReadUtc,
                    now
                ),
                cancellationToken
            );
    }
}