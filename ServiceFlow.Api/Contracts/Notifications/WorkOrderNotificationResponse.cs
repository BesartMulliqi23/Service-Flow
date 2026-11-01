using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Contracts.Notifications;

public sealed record WorkOrderNotificationResponse(
    Guid Id,
    Guid WorkOrderId,
    WorkOrderNotificationType Type,
    string Title,
    string Message,
    DateTime? ScheduledStartUtc,
    DateTime CreatedUtc,
    bool IsRead
);