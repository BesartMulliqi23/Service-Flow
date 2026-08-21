using ServiceFlow.Api.Contracts.WorkOrders;

namespace ServiceFlow.Api.Services.WorkOrders;

public sealed record UpdateWorkOrderResult(
    UpdateWorkOrderStatus Status,
    WorkOrderResponse? WorkOrder
);