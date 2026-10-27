using ServiceFlow.Api.Contracts.WorkOrderNotes;

namespace ServiceFlow.Api.Services.WorkOrderNotes;

public interface IWorkOrderNoteService
{
    Task<IReadOnlyList<WorkOrderNoteResponse>?> GetForTechnicianAsync(
        Guid workOrderId,
        CancellationToken cancellationToken
    );

    Task<IReadOnlyList<WorkOrderNoteResponse>?> GetForOperationsAsync(
        Guid workOrderId,
        CancellationToken cancellationToken
    );

    Task<WorkOrderNoteMutationResult> CreateForTechnicianAsync(
        Guid workOrderId,
        string content,
        CancellationToken cancellationToken
    );
}