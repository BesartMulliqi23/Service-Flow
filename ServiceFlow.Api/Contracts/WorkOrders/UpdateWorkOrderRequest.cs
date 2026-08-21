using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Contracts.WorkOrders;

public sealed record UpdateWorkOrderRequest(
    string? Title,
    string? Description,
    WorkOrderPriority Priority,
    DateTime? DueUtc
);