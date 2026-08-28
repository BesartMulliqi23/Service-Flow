using ServiceFlow.Api.Contracts.TechnicianWorkOrders;

namespace ServiceFlow.Api.Services.TechnicianWorkOrders;

public sealed record TechnicianWorkOrderExecutionResult(
    TechnicianWorkOrderExecutionStatus Status,
    TechnicianWorkOrderResponse? WorkOrder
);