namespace ServiceFlow.Api.Contracts.AuditLogs;

public sealed record PagedAuditLogsResponse(
    IReadOnlyList<AuditLogEntryResponse> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages
);