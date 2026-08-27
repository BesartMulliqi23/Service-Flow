
namespace ServiceFlow.Api.Models;

public sealed class WorkOrderStatusChange : IOrganizationOwned
{
    public Guid Id { get; set; }

    public Guid WorkOrderId { get; set; }
    public WorkOrder WorkOrder { get; set; } = null!;

    public string ChangedByUserId { get; set; } = string.Empty;
    public ApplicationUser ChangedByUser { get; set; } = null!;

    public Guid OrganizationId { get; set; }

    public WorkOrderStatus PreviousStatus { get; set; }
    public WorkOrderStatus NewStatus { get; set; }

    public string? Note { get; set; }
    public DateTime ChangedUtc { get; set; }
}