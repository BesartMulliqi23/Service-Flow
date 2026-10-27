using ServiceFlow.Api.Contracts.WorkOrderNotes;

namespace ServiceFlow.Api.Services.WorkOrderNotes;

public sealed record WorkOrderNoteMutationResult(
    WorkOrderNoteMutationStatus Status,
    WorkOrderNoteResponse? Note
);