using Microsoft.AspNetCore.Identity;

namespace ServiceFlow.Api.Models;

public sealed class ApplicationUser : IdentityUser
{
    public string DisplayName { get; set; } = string.Empty;

    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;

    public ICollection<WorkOrderAssignment> WorkOrderAssignments { get; } = [];

    public ICollection<WorkOrderStatusChange> WorkOrderStatusChanges { get; } = [];
}