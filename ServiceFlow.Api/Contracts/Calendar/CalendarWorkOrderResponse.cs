using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Contracts.Calendar;

public sealed record CalendarWorkOrderResponse(
    Guid Id,
    string Title,
    WorkOrderPriority Priority,
    WorkOrderStatus Status,
    DateTime ScheduledStartUtc,
    DateTime ScheduledEndUtc,
    DateTime? StartedUtc,
    Guid CustomerId,
    string CustomerName,
    Guid ServiceLocationId,
    string ServiceLocationName,
    IReadOnlyList<CalendarTechnicianResponse> Technicians
);