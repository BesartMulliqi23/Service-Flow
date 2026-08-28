using ServiceFlow.Api.Contracts.WorkOrders;
using ServiceFlow.Api.Services.Scheduling;

namespace ServiceFlow.Api.Services.WorkOrders;

public sealed record ScheduleWorkOrderResult(
    ScheduleWorkOrderStatus Status,
    WorkOrderResponse? WorkOrder,
    TechnicianScheduleConflict? Conflict = null
);