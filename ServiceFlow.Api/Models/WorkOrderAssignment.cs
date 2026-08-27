
namespace ServiceFlow.Api.Models;

public sealed class WorkOrderAssignment : IOrganizationOwned
{
    public Guid WorkOrderId { get; set; }
    public WorkOrder WorkOrder { get; set; } = null!;

    public string TechnicianId  { get; set; } = string.Empty;
    public ApplicationUser Technician { get; set; } = null!;

    public DateTime AssignedUtc  { get; set; }
    public Guid OrganizationId { get; set; }
}