namespace ServiceFlow.Api.Models;

public sealed class Organization
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedUtc { get; set; }
    public ICollection<ApplicationUser> Users { get; } = [];
}