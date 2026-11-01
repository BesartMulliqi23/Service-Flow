using ServiceFlow.Api.Data;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.Notifications;

public sealed class WorkOrderNotificationWriter(
    ApplicationDbContext dbContext
) : IWorkOrderNotificationWriter
{
    public void AddTechnicianAssignmentNotification(
        WorkOrder workOrder, 
        WorkOrderAssignment assignment
    )
    {
        if (!workOrder.ScheduledStartUtc.HasValue)
        {
            throw new InvalidOperationException("A Technician assignment notification requires a scheduled Work Order.");
        }

        Add(
            workOrder,
            assignment.TechnicianId,
            WorkOrderNotificationType.TechnicianAssigned,
            "New job assignment",
            $"You have been assigned to \"{workOrder.Title}\" at " + 
            $"{workOrder.ServiceLocation.Customer.Name} — {workOrder.ServiceLocation.Name}.",
            workOrder.ScheduledStartUtc,
            $"assignment:{workOrder.Id:N}:{assignment.TechnicianId}:{assignment.AssignedUtc.Ticks}",
            assignment.AssignedUtc
        );
    }

    public void AddWorkOrderRescheduledNotifications(
        WorkOrder workOrder, 
        IReadOnlyCollection<string> technicianIds
    )
    {
        if (!workOrder.ScheduledStartUtc.HasValue ||
            !workOrder.ScheduledEndUtc.HasValue ||
            !workOrder.UpdatedUtc.HasValue)
        {
            throw new InvalidOperationException("A reschedule notification requires a fully scheduled Work Order.");
        }
        
        foreach (var technicianId in technicianIds)
        {
            Add(
                workOrder,
                technicianId,
                WorkOrderNotificationType.WorkOrderRescheduled,
                "Work Order rescheduled",
                $"\"{workOrder.Title}\" at " +
                $"{workOrder.ServiceLocation.Customer.Name} — {workOrder.ServiceLocation.Name} " + 
                "has been rescheduled.",
                workOrder.ScheduledStartUtc,
                $"schedule-change:{workOrder.Id:N}:{technicianId}:{workOrder.UpdatedUtc.Value.Ticks}",
                workOrder.UpdatedUtc.Value
            );
        }
    }

    private void Add(
        WorkOrder workOrder,
        string recipientUserId,
        WorkOrderNotificationType type,
        string title,
        string message,
        DateTime? scheduledStartUtc,
        string deduplicationKey,
        DateTime createdUtc
    )
    {
        dbContext.WorkOrderNotifications.Add(new WorkOrderNotification
        {
            Id = Guid.NewGuid(),
            OrganizationId = workOrder.OrganizationId,
            WorkOrderId = workOrder.Id,
            RecipientUserId = recipientUserId,
            Type = type,
            Title = title,
            Message = message,
            ScheduledStartUtc = scheduledStartUtc,
            DeduplicationKey = deduplicationKey,
            CreatedUtc = createdUtc
        });
    }
}