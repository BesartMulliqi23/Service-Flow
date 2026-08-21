using ServiceFlow.Api.Contracts.WorkOrders;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.WorkOrders;

public interface IWorkOrderService
{
    Task<CreateWorkOrderResult> CreateAsync(CreateWorkOrderRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<WorkOrderResponse>> GetAllAsync(
        Guid? serviceLocationId,
        WorkOrderStatus? status,
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