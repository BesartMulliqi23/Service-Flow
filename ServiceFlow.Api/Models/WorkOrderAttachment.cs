namespace ServiceFlow.Api.Models;

public sealed class WorkOrderAttachment : IOrganizationOwned
{
    public Guid Id { get; set; }

    public Guid OrganizationId { get; set; }

    public Guid WorkOrderId { get; set; }
    public WorkOrder WorkOrder { get; set; } = null!;

    public string UploadedByUserId { get; set; } = string.Empty;
    public ApplicationUser UploadedByUser { get; set; } = null!;

    public string OriginalFileName { get; set; } = string.Empty;

    public string ContentType { get; set; } = string.Empty;

    public long FileSizeBytes { get; set; }

    // Cloudinary metadata only. We never store file bytes or permanent delivery URLs in SQL Server.
    public string CloudinaryAssetId { get; set; } = string.Empty;
    public string CloudinaryPublicId { get; set; } = string.Empty;
    public string CloudinaryResourceType { get; set; } = string.Empty;
    public DateTime CreatedUtc { get; set; }
}