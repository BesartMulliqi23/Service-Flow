using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.AuditLogging;

public interface IAuditLogWriter
{
    Task AddAsync(
        AuditLogAction action,
        string entityType,
        Guid entityId,
        string summary,
        CancellationToken cancellationToken
    );
}