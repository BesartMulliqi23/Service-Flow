using Microsoft.EntityFrameworkCore;
using ServiceFlow.Api.Data;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.Notifications;

public sealed class WorkOrderReminderProcessor(
    ApplicationDbContext dbContext
) : IWorkOrderReminderProcessor
{
    private static readonly TimeSpan ReminderWindow =  TimeSpan.FromHours(24);

    public async Task<int> ProcessAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var reminderWindowEnd = now.Add(ReminderWindow);

        var candidates = await dbContext.WorkOrderAssignments
            .AsNoTracking()
            .Where(
                assignment =>
                    assignment.WorkOrder.Status == WorkOrderStatus.Scheduled &&
                    assignment.WorkOrder.ScheduledStartUtc.HasValue &&
                    assignment.WorkOrder.ScheduledStartUtc > now &&
                    assignment.WorkOrder.ScheduledStartUtc <= reminderWindowEnd
            )
            .Select(assignment => new WorkOrderReminderCandidate(
                assignment.OrganizationId,
                assignment.WorkOrderId,
                assignment.TechnicianId,
                assignment.WorkOrder.Title,
                assignment.WorkOrder.ServiceLocation.Customer.Name,
                assignment.WorkOrder.ServiceLocation.Name,
                assignment.WorkOrder.ScheduledStartUtc!.Value
            ))
            .ToListAsync(cancellationToken);

        if (candidates.Count == 0)
        {
            return 0;
        }

        var candidateKeys = candidates.Select(CreateDeduplicationKey).ToList();

        var existingKeys = (await dbContext.WorkOrderNotifications
            .AsNoTracking()
            .Where(
                notification =>
                    notification.Type == WorkOrderNotificationType.UpcomingWorkOrderReminder &&
                    candidateKeys.Contains(notification.DeduplicationKey)
            )
            .Select(notification => notification.DeduplicationKey)
            .ToListAsync(cancellationToken))
            .ToHashSet();

        var reminders = candidates
            .Where(candidate => !existingKeys.Contains(CreateDeduplicationKey(candidate)))
            .Select(candidate => new WorkOrderNotification
            {
                Id = Guid.NewGuid(),
                OrganizationId = candidate.OrganizationId,
                WorkOrderId = candidate.WorkOrderId,
                RecipientUserId = candidate.TechnicianId,
                Type = WorkOrderNotificationType.UpcomingWorkOrderReminder,
                Title = "Upcoming Work Order",
                Message =
                    $"\"{candidate.WorkOrderTitle}\" at " +
                    $"{candidate.CustomerName} — {candidate.ServiceLocationName} " +
                    "is scheduled within the next 24 hours.",
                ScheduledStartUtc = candidate.ScheduledStartUtc,
                DeduplicationKey = CreateDeduplicationKey(candidate),
                CreatedUtc = now
            })
            .ToList();

        if (reminders.Count == 0)
        {
            return 0;
        }

        dbContext.WorkOrderNotifications.AddRange(reminders);

        await dbContext.SaveChangesAsync(cancellationToken);

        return reminders.Count;
    }

    private static string CreateDeduplicationKey(WorkOrderReminderCandidate candidate)
    {
        return
            $"upcoming-reminder:{candidate.WorkOrderId:N}:" +
            $"{candidate.TechnicianId}:{candidate.ScheduledStartUtc.Ticks}";
    }
}