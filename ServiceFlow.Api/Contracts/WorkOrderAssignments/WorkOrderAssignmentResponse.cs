namespace ServiceFlow.Api.Contracts.WorkOrderAssignments;

public sealed record WorkOrderAssignmentResponse(
    string TechnicianId,
    string DisplayName,
    string Email,
    DateTime AssignedUtc
);