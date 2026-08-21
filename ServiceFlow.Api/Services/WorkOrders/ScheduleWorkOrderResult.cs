using ServiceFlow.Api.Contracts.WorkOrders;

namespace ServiceFlow.Api.Services.WorkOrders;

public sealed record ScheduleWorkOrderResult(
    ScheduleWorkOrderStatus Status,
    WorkOrderResponse? WorkOrder
);