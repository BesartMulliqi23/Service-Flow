using ServiceFlow.Api.Contracts.TechnicianWorkOrders;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.TechnicianWorkOrders;

public interface ITechnicianWorkOrderService
{
    Task<IReadOnlyList<TechnicianWorkOrderResponse>> GetAllAsync(
        WorkOrderStatus? status,
        CancellationToken cancellationToken
    );

    Task<TechnicianWorkOrderResponse?> GetByIdAsync(
        Guid workOrderId,
        CancellationToken cancellationToken
    );
}