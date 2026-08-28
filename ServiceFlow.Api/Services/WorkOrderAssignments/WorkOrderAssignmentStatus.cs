namespace ServiceFlow.Api.Services.WorkOrderAssignments;

public enum WorkOrderAssignmentStatus
{
    Success,
    WorkOrderNotFound,
    AssignmentNotFound,
    TechnicianNotFound,
    TechnicianNotEligible,
    AlreadyAssigned,
    ScheduleConflict,
    WorkOrderNotAssignable,
    ServiceLocationInactive,
    CustomerInactive
}