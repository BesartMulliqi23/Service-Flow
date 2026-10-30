namespace ServiceFlow.Api.Services.WorkOrderAttachments;

public enum WorkOrderAttachmentMutationStatus
{
    Success,
    WorkOrderNotFound,
    WorkOrderNotInProgress,
    InvalidFile,
    AttachmentLimitReached,
    StorageFailure
}