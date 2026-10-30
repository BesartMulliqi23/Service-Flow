namespace ServiceFlow.Api.Services.WorkOrderAttachments;

public interface IWorkOrderAttachmentStorage
{
    Task<StoredWorkOrderAttachment> UploadAsync(
        WorkOrderAttachmentUpload upload,
        CancellationToken cancellationToken
    );

    Task DeleteAsync(
        string publicId,
        string resourceType,
        CancellationToken cancellationToken
    );

    string CreatePrivateDownloadUrl(
        string publicId,
        string resourceType,
        string originalFileName,
        DateTimeOffset expiresAt
    );
}

public sealed record WorkOrderAttachmentUpload(
    Guid AttachmentId,
    Guid OrganizationId,
    Guid WorkOrderId,
    string OriginalFileName,
    string FileExtension,
    Stream Content
);

public sealed record StoredWorkOrderAttachment(
    string AssetId,
    string PublicId,
    string ResourceType
);