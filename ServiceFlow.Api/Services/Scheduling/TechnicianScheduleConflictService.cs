using Microsoft.EntityFrameworkCore;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Data;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.Scheduling;

public sealed class TechnicianScheduleConflictService(
    ApplicationDbContext dbContext,
    ICurrentOrganization currentOrganization
) : ITechnicianScheduleConflictService
{
    public async Task<TechnicianScheduleConflict?> FindFirstAsync(
        string technicianId, 
        Guid excludedWorkOrderId, 
        DateTime scheduledStartUtc, 
        DateTime scheduledEndUtc, 
        CancellationToken cancellationToken
    )
    {
        var organizationId = currentOrganization.OrganizationId;

        return await dbContext.WorkOrders
            .AsNoTracking()
            .Where(
                workOrder =>
                    workOrder.OrganizationId == organizationId &&
                    workOrder.Id != excludedWorkOrderId &&
                    (workOrder.Status == WorkOrderStatus.Scheduled || workOrder.Status == WorkOrderStatus.InProgress) &&
                    workOrder.ScheduledStartUtc.HasValue &&
                    workOrder.ScheduledEndUtc.HasValue &&
                    workOrder.Assignments.Any(
                        assignment =>
                            assignment.OrganizationId == organizationId &&
                            assignment.TechnicianId == technicianId
                    ) &&
                    scheduledStartUtc < workOrder.ScheduledEndUtc.Value &&
                    workOrder.ScheduledStartUtc.Value < scheduledEndUtc
            )
            .OrderBy(workOrder => workOrder.ScheduledStartUtc)
            .Select(workOrder => new TechnicianScheduleConflict(
                workOrder.Id,
                workOrder.Title,
                workOrder.ScheduledStartUtc!.Value,
                workOrder.ScheduledEndUtc!.Value
            ))
            .FirstOrDefaultAsync(cancellationToken);
    }
}