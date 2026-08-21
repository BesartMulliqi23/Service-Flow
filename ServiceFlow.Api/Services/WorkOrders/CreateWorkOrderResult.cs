using ServiceFlow.Api.Contracts.WorkOrders;

namespace ServiceFlow.Api.Services.WorkOrders;

public sealed record CreateWorkOrderResult(
    CreateWorkOrderStatus Status,
    WorkOrderResponse? WorkOrder 
);