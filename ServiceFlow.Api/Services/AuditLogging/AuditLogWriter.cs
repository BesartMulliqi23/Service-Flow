using Microsoft.EntityFrameworkCore;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Data;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.AuditLogging;

public sealed class AuditLogWriter(
    ApplicationDbContext dbContext,
    ICurrentOrganization currentOrganization
) : IAuditLogWriter
{
    public async Task AddAsync(
        AuditLogAction action, 
        string entityType, 
        Guid entityId, 
        string summary, 
        CancellationToken cancellationToken
    )
    {
        var organizationId = currentOrganization.OrganizationId;
        var actorUserId = currentOrganization.UserId;

        var actorDisplayName = await dbContext.Users
            .AsNoTracking()
            .Where(
                user =>
                    user.Id == actorUserId &&
                    user.OrganizationId == organizationId
            )
            .Select(user => user.DisplayName)
            .SingleAsync(cancellationToken);

        dbContext.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            ActorUserId = actorUserId,
            ActorDisplayName = actorDisplayName,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Summary = summary,
            CreatedUtc = DateTime.UtcNow
        });
    }
}