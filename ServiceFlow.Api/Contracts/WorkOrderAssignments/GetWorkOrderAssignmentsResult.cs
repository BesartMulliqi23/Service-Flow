using ServiceFlow.Api.Services.WorkOrderAssignments;

namespace ServiceFlow.Api.Contracts.WorkOrderAssignments;

public sealed record GetWorkOrderAssignmentsResult(
    WorkOrderAssignmentStatus Status,
    IReadOnlyList<WorkOrderAssignmentResponse> Assignments
);