namespace ServiceFlow.Api.Services.Scheduling;

public sealed record TechnicianScheduleConflict(
    Guid WorkOrderId,
    string WorkOrderTitle,
    DateTime ScheduledStartUtc,
    DateTime ScheduledEndUtc
);