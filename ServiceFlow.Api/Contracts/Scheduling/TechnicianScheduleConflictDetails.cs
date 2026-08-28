namespace ServiceFlow.Api.Contracts.Scheduling;

public sealed record TechnicianScheduleConflictDetails(
    Guid WorkOrderId,
    string WorkOrderTitle,
    DateTime ScheduledStartUtc,
    DateTime ScheduledEndUtc
);