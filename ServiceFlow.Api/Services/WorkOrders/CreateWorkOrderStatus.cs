namespace ServiceFlow.Api.Services.WorkOrders;

public enum CreateWorkOrderStatus
{
    Success,
    ServiceLocationNotFound,
    ServiceLocationInactive,
    CustomerInactive
}