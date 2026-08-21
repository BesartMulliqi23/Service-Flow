namespace ServiceFlow.Api.Services.WorkOrders;

public enum ScheduleWorkOrderStatus
{
    Success,
    NotFound,
    InvalidSchedule,
    WorkOrderNotSchedulable,
    ServiceLocationInactive,
    CustomerInactive
}