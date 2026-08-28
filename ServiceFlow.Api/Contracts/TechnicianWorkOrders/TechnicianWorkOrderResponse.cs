using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Contracts.TechnicianWorkOrders;

public sealed record TechnicianWorkOrderResponse(
    Guid Id,
    string Title,
    string Description,
    WorkOrderPriority Priority,
    WorkOrderStatus Status,
    string CustomerName,
    Guid ServiceLocationId,
    string ServiceLocationName,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string? PostalCode,
    string Country,
    string? AccessInstructions,
    DateTime? DueUtc,
    DateTime? ScheduledStartUtc,
    DateTime? ScheduledEndUtc,
    DateTime? StartedUtc,
    DateTime? CompletedUtc
);