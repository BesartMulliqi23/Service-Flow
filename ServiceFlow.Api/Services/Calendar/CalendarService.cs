using Microsoft.EntityFrameworkCore;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.Calendar;
using ServiceFlow.Api.Data;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.Calendar;

public sealed class CalendarService(
    ApplicationDbContext dbContext,
    ICurrentOrganization currentOrganization
) : ICalendarService
{
    public async Task<IReadOnlyList<CalendarWorkOrderResponse>> GetWorkOrderAsync(
        DateTime fromUtc, 
        DateTime toUtc, 
        string? technicianId, 
        CancellationToken cancellationToken
    )
    {
        var organizationId = currentOrganization.OrganizationId;

        var query = dbContext.WorkOrders
            .AsNoTracking()
            .Where(workOrder =>
                workOrder.OrganizationId == organizationId &&
                (workOrder.Status == WorkOrderStatus.Scheduled || workOrder.Status == WorkOrderStatus.InProgress) &&
                workOrder.ScheduledStartUtc.HasValue &&
                workOrder.ScheduledEndUtc.HasValue &&
                workOrder.ScheduledStartUtc.Value < toUtc &&
                workOrder.ScheduledEndUtc > fromUtc);

        if (!string.IsNullOrWhiteSpace(technicianId))
        {
            query = query.Where(workOrder => 
                workOrder.Assignments.Any(assignment => 
                    assignment.OrganizationId == organizationId && 
                    assignment.TechnicianId == technicianId));
        }
        
        return await query
            .OrderBy(workOrder => workOrder.ScheduledStartUtc)
            .ThenBy(workOrder => workOrder.Title)
            .Select(workOrder => new CalendarWorkOrderResponse(
                workOrder.Id,
                workOrder.Title,
                workOrder.Priority,
                workOrder.Status,
                workOrder.ScheduledStartUtc!.Value,
                workOrder.ScheduledEndUtc!.Value,
                workOrder.StartedUtc,
                workOrder.ServiceLocation.CustomerId,
                workOrder.ServiceLocation.Customer.Name,
                workOrder.ServiceLocationId,
                workOrder.ServiceLocation.Name,
                workOrder.Assignments
                    .Where(assignment => assignment.OrganizationId == organizationId)
                    .OrderBy(assignment => assignment.AssignedUtc)
                    .Select(assignment => new CalendarTechnicianResponse(
                        assignment.TechnicianId,
                        assignment.Technician.DisplayName
                    ))
                    .ToList()
            ))
            .ToListAsync(cancellationToken);
    }
}