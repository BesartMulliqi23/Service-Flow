using ServiceFlow.Api.Contracts.Materials;

namespace ServiceFlow.Api.Services.Materials;

public interface IWorkOrderMaterialService
{
    Task<GetWorkOrderMaterialsResult> GetAllAsync(
        Guid workOrderId,
        CancellationToken cancellationToken
    );

    Task<WorkOrderMaterialMutationResult> AddAsync(
        Guid workOrderId,
        AddWorkOrderMaterialRequest request,
        CancellationToken cancellationToken
    );

    Task<WorkOrderMaterialMutationResult> UpdateAsync(
        Guid workOrderId,
        Guid workOrderMaterialId,
        UpdateWorkOrderMaterialRequest request,
        CancellationToken cancellationToken
    );

    Task<WorkOrderMaterialOperationStatus> RemoveAsync(
        Guid workOrderId,
        Guid workOrderMaterialId,
        CancellationToken cancellationToken
    );
}