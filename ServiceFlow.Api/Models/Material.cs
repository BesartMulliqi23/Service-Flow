
namespace ServiceFlow.Api.Models;

public sealed class Material : IOrganizationOwned
{
    public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Sku { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public decimal DefaultUnitCost { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedUtc { get; set; }
    public DateTime? UpdatedUtc { get; set; }
    public ICollection<WorkOrderMaterial> WorkOrderMaterials { get; } = [];
}