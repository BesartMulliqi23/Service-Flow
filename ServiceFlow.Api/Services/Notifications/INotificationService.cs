using ServiceFlow.Api.Contracts.Notifications;

namespace ServiceFlow.Api.Services.Notifications;

public interface INotificationService
{
    Task<IReadOnlyList<WorkOrderNotificationResponse>> GetForCurrentUserAsync(
        int take,
        CancellationToken cancellationToken
    );

    Task<int> GetUnreadCountForCurrentUserAsync(CancellationToken cancellationToken);

    Task<bool> MarkReadAsync(
        Guid notificationId,
        CancellationToken cancellationToken
    );

    Task<int> MarkAllReadAsync(CancellationToken cancellationToken);
}