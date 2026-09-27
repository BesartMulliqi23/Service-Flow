
namespace ServiceFlow.Api.Models;

public sealed class WorkOrderMaterial : IOrganizationOwned
{
    public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }

    public Guid WorkOrderId { get; set; }
    public WorkOrder WorkOrder { get; set; } = null!;

    public Guid MaterialId { get; set; }
    public Material Material { get; set; } = null!;
    public string MaterialName { get; set; } = string.Empty;
    public string UnitOfMeasure { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public DateTime AddedUtc { get; set; }
    public DateTime? UpdatedUtc { get; set; }
}