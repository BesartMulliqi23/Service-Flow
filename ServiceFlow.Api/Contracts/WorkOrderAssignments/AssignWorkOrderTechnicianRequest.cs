namespace ServiceFlow.Api.Contracts.WorkOrderAssignments;

public sealed record AssignWorkOrderTechnicianRequest(
    string? TechnicianId
);