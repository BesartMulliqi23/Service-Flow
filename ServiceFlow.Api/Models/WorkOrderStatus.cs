namespace ServiceFlow.Api.Models;

public enum WorkOrderStatus
{
    Draft = 1,
    Scheduled = 2,
    InProgress = 3,
    Completed = 4,
    Cancelled = 5
}