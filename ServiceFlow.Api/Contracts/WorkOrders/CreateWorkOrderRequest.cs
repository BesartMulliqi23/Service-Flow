using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Contracts.WorkOrders;

public sealed record CreateWorkOrderRequest(
    Guid ServiceLocationId,
    string? Title,
    string? Description,
    WorkOrderPriority Priority,
    DateTime? DueUtc
);