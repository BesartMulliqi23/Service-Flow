using Microsoft.EntityFrameworkCore;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.AuditLogs;
using ServiceFlow.Api.Data;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.AuditLogging;

public sealed class AuditLogService(
    ApplicationDbContext dbContext,
    ICurrentOrganization currentOrganization
) : IAuditLogService
{
    public async Task<PagedAuditLogsResponse> GetForCurrentOrganizationAsync(
        int page, 
        int pageSize, 
        string? actorUserId, 
        AuditLogAction? action, 
        string? entityType, 
        DateTime? fromUtc, 
        DateTime? toUtc, 
        CancellationToken cancellationToken
    )
    {
        var organizationId = currentOrganization.OrganizationId;

        var query = dbContext.AuditLogs
            .AsNoTracking()
            .Where(auditLog => auditLog.OrganizationId == organizationId);

        if (!string.IsNullOrWhiteSpace(actorUserId))
        {
            query = query.Where(auditLog => auditLog.ActorUserId == actorUserId);
        }

        if (action.HasValue)
        {
            query = query.Where(auditLog => auditLog.Action == action.Value);
        }

        if (!string.IsNullOrWhiteSpace(entityType))
        {
            query = query.Where(auditLog => auditLog.EntityType == entityType);
        }

        if (fromUtc.HasValue)
        {
            query = query.Where(auditLog => auditLog.CreatedUtc >= fromUtc);
        }

        if (toUtc.HasValue)
        {
            query = query.Where(auditLog => auditLog.CreatedUtc <= toUtc);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(auditLog => auditLog.CreatedUtc)
            .ThenByDescending(auditLog => auditLog.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(auditLog => new AuditLogEntryResponse(
                auditLog.Id,
                auditLog.ActorUserId,
                auditLog.ActorDisplayName,
                auditLog.Action,
                auditLog.EntityType,
                auditLog.EntityId,
                auditLog.Summary,
                auditLog.CreatedUtc
            ))
            .ToListAsync(cancellationToken);

        return new PagedAuditLogsResponse(
            items,
            page,
            pageSize,
            totalCount,
            (int)Math.Ceiling(totalCount / (double)pageSize)
        );
    }
}