namespace ServiceFlow.Api.Services.Notifications;

internal sealed record WorkOrderReminderCandidate(
    Guid OrganizationId,
    Guid WorkOrderId,
    string TechnicianId,
    string WorkOrderTitle,
    string CustomerName,
    string ServiceLocationName,
    DateTime ScheduledStartUtc
);