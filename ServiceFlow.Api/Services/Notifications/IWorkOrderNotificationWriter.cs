using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.Notifications;

public interface IWorkOrderNotificationWriter
{
    void AddTechnicianAssignmentNotification(
        WorkOrder workOrder,
        WorkOrderAssignment assignment
    );

    void AddWorkOrderRescheduledNotifications(
        WorkOrder workOrder,
        IReadOnlyCollection<string> technicianIds
    );
}