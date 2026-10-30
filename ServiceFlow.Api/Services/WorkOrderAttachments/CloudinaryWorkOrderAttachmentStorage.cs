using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace ServiceFlow.Api.Services.WorkOrderAttachments;

public sealed class CloudinaryWorkOrderAttachmentStorage(
    Cloudinary cloudinary
) : IWorkOrderAttachmentStorage
{
    private const string PrivateDeliveryType = "private";
    private const string RawResourceType = "raw"; 

    // public async Task<StoredWorkOrderAttachment> UploadAsync(
    //     WorkOrderAttachmentUpload upload, 
    //     CancellationToken cancellationToken
    // )
    // {
    //     var assetFolder = $"serviceFlow/organizations/{upload.OrganizationId:N}/work-orders/{upload.WorkOrderId:N}";

    //     var isImage = upload.FileExtension.ToLowerInvariant() switch
    //     {
    //         ".jpg" or ".jpeg" or ".webp" or ".png" => true,
    //         ".pdf" => false,
    //         _ => throw new InvalidOperationException($"Unsupported attachment extension: {upload.FileExtension}")
    //     };

    //     var resourceType = isImage ? "image" : RawResourceType;

    //     var publicId = isImage
    //         ? upload.AttachmentId.ToString("N")
    //         : $"{upload.AttachmentId:N}{upload.FileExtension}";

    //     using var fileDescription = new FileDescription(upload.OriginalFileName, upload.Content);

    //     UploadResult result;

    //     if (isImage)
    //     {
    //         result = await cloudinary.UploadAsync(
    //         );
    //     } 

    //     // var result = await cloudinary.UploadAsync(
    //     //     new RawUploadParams
    //     //     {
    //     //         File = fileDescription,
    //     //         PublicId = publicId,
    //     //         AssetFolder = assetFolder,
    //     //         Type = PrivateDeliveryType,
    //     //         UseFilename = false,
    //     //         UniqueFilename = false,
    //     //         Overwrite = false,
    //     //         ResourceType = "auto"
    //     //     },
    //     //     cancellationToken
    //     // );
    // }

    public async Task<StoredWorkOrderAttachment> UploadAsync(
        WorkOrderAttachmentUpload upload,
        CancellationToken cancellationToken
    )
    {
        var assetFolder =
            $"serviceflow/organizations/{upload.OrganizationId:N}/work-orders/{upload.WorkOrderId:N}";

        var publicId = $"{upload.AttachmentId:N}{upload.FileExtension}";

        using var fileDescription = new FileDescription(
            upload.OriginalFileName,
            upload.Content
        );

        var result = await cloudinary.UploadAsync(
            new RawUploadParams
            {
                File = fileDescription,
                PublicId = publicId,
                AssetFolder = assetFolder,
                Type = PrivateDeliveryType,
                UseFilename = false,
                UniqueFilename = false,
                Overwrite = false
            },
            type: "auto",
            cancellationToken
        );

        if (result.Error is not null ||
            string.IsNullOrWhiteSpace(result.AssetId) ||
            string.IsNullOrWhiteSpace(result.PublicId))
        {
            throw new InvalidOperationException(
                result.Error?.Message ?? "Cloudinary did not return attachment metadata."
            );
        }

        return new StoredWorkOrderAttachment(
            result.AssetId,
            result.PublicId,
            RawResourceType
        );
    }

    public async Task DeleteAsync(
        string publicId, 
        string resourceType, 
        CancellationToken cancellationToken
    )
    {
        if (!Enum.TryParse<ResourceType>(
            resourceType,
            ignoreCase: true,
            out var parsedResourceType
        ))
        {
            throw new ArgumentException($"Unsupported Cloudinary resource type: {resourceType}", nameof(resourceType));
        }

        var result = await cloudinary.DestroyAsync(
            new DeletionParams(publicId)
            {
                ResourceType = parsedResourceType,
                Type = PrivateDeliveryType,
                Invalidate = true
            }
        );

        if (result.Error is not null)
        {
            throw new InvalidOperationException(result.Error.Message);
        }
    }

    public string CreatePrivateDownloadUrl(
        string publicId, 
        string resourceType, 
        string originalFileName, 
        DateTimeOffset expiresAt
    )
    {
        return cloudinary.DownloadPrivate(
            publicId,
            attachment: false,
            type: PrivateDeliveryType,
            expiresAt: expiresAt.ToUnixTimeSeconds(),
            resourceType: resourceType,
            targetFilename: originalFileName
        );
    }
}