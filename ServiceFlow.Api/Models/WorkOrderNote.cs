namespace ServiceFlow.Api.Models;

public sealed class WorkOrderNote
{
    public Guid Id { get; set; }

    public Guid OrganizationId { get; set; }

    public Guid WorkOrderId { get; set; }
    public WorkOrder WorkOrder { get; set; } = null!;

    public string CreatedByUserId { get; set; } = string.Empty;
    public ApplicationUser CreatedByUser { get; set; } = null!;

    public string Content { get; set; } = string.Empty;

    public DateTime CreatedUtc { get; set; }
}