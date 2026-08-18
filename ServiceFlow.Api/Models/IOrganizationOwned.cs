namespace ServiceFlow.Api.Models;

public interface IOrganizationOwned
{
    Guid OrganizationId { get; set; }
}