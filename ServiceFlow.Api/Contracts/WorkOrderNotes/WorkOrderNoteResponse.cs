namespace ServiceFlow.Api.Contracts.WorkOrderNotes;

public sealed record WorkOrderNoteResponse(
    Guid Id,
    string Content,
    string CreatedByDisplayName,
    DateTime CreatedUtc
);