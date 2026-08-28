using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Contracts.WorkOrders;

public sealed record WorkOrderResponse(
    Guid Id,
    Guid ServiceLocationId,
    string ServiceLocationName,
    Guid CustomerId,
    string CustomerName,
    string Title,
    string Description,
    WorkOrderPriority Priority,
    WorkOrderStatus Status,
    DateTime? DueUtc,
    DateTime? ScheduledStartUtc,
    DateTime? ScheduledEndUtc,
    DateTime? StartedUtc,
    DateTime? CompletedUtc,
    DateTime CreatedUtc,
    DateTime? UpdatedUtc
);