using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Contracts.Dashboard;

public sealed record DashboardUpcomingWorkOrderResponse(
    Guid Id,
    string Title,
    WorkOrderPriority Priority,
    DateTime ScheduledStartUtc,
    DateTime ScheduledEndUtc,
    string CustomerName,
    string ServiceLocationName,
    IReadOnlyList<string> TechnicianNames
);