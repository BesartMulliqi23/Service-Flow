using ServiceFlow.Api.Contracts.WorkOrderAttachments;

namespace ServiceFlow.Api.Services.WorkOrderAttachments;

public sealed record WorkOrderAttachmentMutationResult(
    WorkOrderAttachmentMutationStatus Status,
    WorkOrderAttachmentResponse? Attachment,
    string? ErrorMessage
);