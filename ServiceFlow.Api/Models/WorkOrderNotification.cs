namespace ServiceFlow.Api.Models;

public sealed class WorkOrderNotification : IOrganizationOwned
{
    public Guid Id { get; set; }

    public Guid OrganizationId { get; set; }

    public Guid WorkOrderId { get; set; }
    public WorkOrder WorkOrder { get; set; } = null!;

    public string RecipientUserId { get; set; } = string.Empty;
    public ApplicationUser RecipientUser { get; set; } = null!;

    public WorkOrderNotificationType Type { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    // A schedule snapshot lets the frontend display the relevant local time,
    // even after the Work Order is later rescheduled.
    public DateTime? ScheduledStartUtc { get; set; }

    // Used for idempotency, especially by the background reminder processor.
    public string DeduplicationKey { get; set; } = string.Empty;

    public DateTime CreatedUtc { get; set; }

    public DateTime? ReadUtc { get; set; }
}