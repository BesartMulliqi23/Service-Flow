using ServiceFlow.Api.Contracts.AuditLogs;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.AuditLogging;

public interface IAuditLogService
{
    Task<PagedAuditLogsResponse> GetForCurrentOrganizationAsync(
        int page,
        int pageSize,
        string? actorUserId,
        AuditLogAction? action,
        string? entityType,
        DateTime? fromUtc,
        DateTime? toUtc,
        CancellationToken cancellationToken
    );
}