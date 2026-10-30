using ServiceFlow.Api.Contracts.WorkOrderAttachments;

namespace ServiceFlow.Api.Services.WorkOrderAttachments;

public interface IWorkOrderAttachmentService
{
    Task<IReadOnlyList<WorkOrderAttachmentResponse>?> GetForTechnicianAsync(
        Guid workOrderId,
        CancellationToken cancellationToken
    );

    Task<IReadOnlyList<WorkOrderAttachmentResponse>?> GetForOperationsAsync(
        Guid workOrderId,
        CancellationToken cancellationToken
    );

    Task<WorkOrderAttachmentMutationResult> UploadForTechnicianAsync(
        Guid workOrderId,
        IFormFile? file,
        CancellationToken cancellationToken 
    );

    Task<string?> GetDownloadUrlForTechnicianAsync(
        Guid workOrderId,
        Guid attachmentId,
        CancellationToken cancellationToken
    );

    Task<string?> GetDownloadUrlForOperationsAsync(
        Guid workOrderId,
        Guid attachmentId,
        CancellationToken cancellationToken
    );
}