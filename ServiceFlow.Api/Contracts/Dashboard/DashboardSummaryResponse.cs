namespace ServiceFlow.Api.Contracts.Dashboard;

public sealed record DashboardSummaryResponse(
    int DraftWorkOrderCount,
    int ScheduledWorkOrderCount,
    int InProgressWorkOrderCount,
    int CompletedWorkOrderCount,
    int CancelledWorkOrderCount,
    int CompletedWorkOrdersLast30Days,
    decimal MaterialCostRecordedLast30Days,
    IReadOnlyList<DashboardUpcomingWorkOrderResponse> UpcomingWorkOrders
);