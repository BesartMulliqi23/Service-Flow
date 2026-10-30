namespace ServiceFlow.Api.Contracts.WorkOrderAttachments;

public sealed record WorkOrderAttachmentResponse(
    Guid Id,
    string OriginalFileName,
    string ContentType,
    long FileSizeBytes,
    string UploadedByDisplayName,
    DateTime CreatedUtc
);