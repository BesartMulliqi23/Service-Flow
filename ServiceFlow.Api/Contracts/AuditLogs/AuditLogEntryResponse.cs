using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Contracts.AuditLogs;

public sealed record AuditLogEntryResponse(
    Guid Id,
    string ActorUserId,
    string ActorDisplayName,
    AuditLogAction Action,
    string EntityType,
    Guid EntityId,
    string Summary,
    DateTime CreatedUtc
);