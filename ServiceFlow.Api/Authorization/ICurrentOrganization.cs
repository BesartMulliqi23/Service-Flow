namespace ServiceFlow.Api.Authorization;

public interface ICurrentOrganization
{
    string UserId { get; }
    Guid OrganizationId { get; }
}