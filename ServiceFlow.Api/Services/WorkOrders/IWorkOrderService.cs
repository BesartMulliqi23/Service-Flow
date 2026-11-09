using ServiceFlow.Api.Contracts.Common;
using ServiceFlow.Api.Contracts.WorkOrders;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.WorkOrders;

public interface IWorkOrderService
{
    Task<CreateWorkOrderResult> CreateAsync(CreateWorkOrderRequest request, CancellationToken cancellationToken);

    Task<PagedResponse<WorkOrderResponse>> GetAllAsync(
        string? search,
        Guid? serviceLocationId,
        WorkOrderStatus? status,
        WorkOrderPriority? priority,
        int page,
        int pageSize,
        CancellationToken cancellationToken
    );

    Task<WorkOrderResponse?> GetByIdAsync(Guid workOrderId, CancellationToken cancellationToken);

    Task<UpdateWorkOrderResult> UpdateAsync(
        Guid workOrderId,
        UpdateWorkOrderRequest request,
        CancellationToken cancellationToken
    );

    Task<ScheduleWorkOrderResult> ScheduleAsync(
        Guid workOrderId,
        ScheduleWorkOrderRequest request,
        CancellationToken cancellationToken
    );
}