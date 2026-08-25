using ServiceFlow.Api.Contracts.WorkOrderAssignments;

namespace ServiceFlow.Api.Services.WorkOrderAssignments;

public interface IWorkOrderAssignmentService
{
    Task<GetWorkOrderAssignmentsResult> GetAllAsync(Guid workOrderId, CancellationToken cancellationToken);

    Task<AssignWorkOrderTechnicianResult> AssignAsync(
        Guid workOrderId,
        AssignWorkOrderTechnicianRequest request,
        CancellationToken cancellationToken
    );

    Task<WorkOrderAssignmentStatus> RemoveAsync(
        Guid workOrderId,
        string technicianId,
        CancellationToken cancellationToken
    );
}