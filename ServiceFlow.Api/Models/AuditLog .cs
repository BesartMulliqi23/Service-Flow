namespace ServiceFlow.Api.Models;

public sealed class AuditLog : IOrganizationOwned
{
    public Guid Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string ActorUserId { get; set; } = string.Empty;
    public ApplicationUser ActorUser { get; set; } = null!;

    public string ActorDisplayName { get; set; } = string.Empty;

    public AuditLogAction Action { get; set; }

    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }

    public string Summary { get; set; } = string.Empty;

    public DateTime CreatedUtc { get; set; }
}