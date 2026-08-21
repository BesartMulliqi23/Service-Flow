namespace ServiceFlow.Api.Contracts.WorkOrders;

public sealed record ScheduleWorkOrderRequest(
    DateTime ScheduledStartUtc,
    DateTime ScheduledEndUtc
);