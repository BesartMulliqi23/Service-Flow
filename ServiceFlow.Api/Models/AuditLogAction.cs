namespace ServiceFlow.Api.Models;

public enum AuditLogAction
{
    CustomerCreated,
    CustomerUpdated,
    CustomerDeactivated,

    ServiceLocationCreated,
    ServiceLocationUpdated,
    ServiceLocationDeactivated,

    WorkOrderCreated,
    WorkOrderUpdated,
    WorkOrderScheduled,
    WorkOrderRescheduled,
    TechnicianAssigned,
    TechnicianUnassigned,

    WorkOrderStarted,
    WorkOrderCompleted,

    MaterialRecorded,
    MaterialUpdated,
    MaterialRemoved,

    JobNoteAdded,
    AttachmentUploaded
}