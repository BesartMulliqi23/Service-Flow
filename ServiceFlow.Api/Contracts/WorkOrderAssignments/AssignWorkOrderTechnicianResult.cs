using ServiceFlow.Api.Services.WorkOrderAssignments;

namespace ServiceFlow.Api.Contracts.WorkOrderAssignments;

public sealed record AssignWorkOrderTechnicianResult(
    WorkOrderAssignmentStatus Status,
    WorkOrderAssignmentResponse? Assignment
);