using Microsoft.EntityFrameworkCore;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.TechnicianWorkOrders;
using ServiceFlow.Api.Data;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.TechnicianWorkOrders;

public sealed class TechnicianWorkOrderService(
    ApplicationDbContext dbContext,
    ICurrentOrganization currentOrganization
) : ITechnicianWorkOrderService
{
    public async Task<IReadOnlyList<TechnicianWorkOrderResponse>> GetAllAsync(
        WorkOrderStatus? status,
        CancellationToken cancellationToken
    )
    {
        var organizationId = currentOrganization.OrganizationId;
        var technicianId = currentOrganization.UserId;

        var query = dbContext.WorkOrders
            .AsNoTracking()
            .Where(
                workOrder =>
                    workOrder.OrganizationId == organizationId &&
                    workOrder.Assignments.Any(
                        assignment =>
                            assignment.OrganizationId == organizationId &&
                            assignment.TechnicianId == technicianId
                    )
            );

        if (status.HasValue)
        {
            query = query.Where(workOrder => workOrder.Status == status.Value);
        }

        return await query
            .OrderBy(workOrder => workOrder.ScheduledStartUtc)
            .ThenByDescending(workOrder => workOrder.CreatedUtc)
            .Select(workOrder => new TechnicianWorkOrderResponse(
                workOrder.Id,
                workOrder.Title,
                workOrder.Description,
                workOrder.Priority,
                workOrder.Status,
                workOrder.ServiceLocation.Customer.Name,
                workOrder.ServiceLocationId,
                workOrder.ServiceLocation.Name,
                workOrder.ServiceLocation.AddressLine1,
                workOrder.ServiceLocation.AddressLine2,
                workOrder.ServiceLocation.City,
                workOrder.ServiceLocation.PostalCode,
                workOrder.ServiceLocation.Country,
                workOrder.ServiceLocation.AccessInstructions,
                workOrder.DueUtc,
                workOrder.ScheduledStartUtc,
                workOrder.ScheduledEndUtc,
                workOrder.StartedUtc,
                workOrder.CompletedUtc
            ))
            .ToListAsync(cancellationToken);
    }

    public async Task<TechnicianWorkOrderResponse?> GetByIdAsync(Guid workOrderId, CancellationToken cancellationToken)
    {
        var organizationId = currentOrganization.OrganizationId;
        var technicianId = currentOrganization.UserId;

        return await dbContext.WorkOrders
            .AsNoTracking()
            .Where(
                workOrder =>
                    workOrder.Id == workOrderId &&
                    workOrder.OrganizationId == organizationId &&
                    workOrder.Assignments.Any(
                        assignment =>
                            assignment.OrganizationId == organizationId &&
                            assignment.TechnicianId == technicianId
                    )
            )
            .Select(workOrder => new TechnicianWorkOrderResponse(
                workOrder.Id,
                workOrder.Title,
                workOrder.Description,
                workOrder.Priority,
                workOrder.Status,
                workOrder.ServiceLocation.Customer.Name,
                workOrder.ServiceLocationId,
                workOrder.ServiceLocation.Name,
                workOrder.ServiceLocation.AddressLine1,
                workOrder.ServiceLocation.AddressLine2,
                workOrder.ServiceLocation.City,
                workOrder.ServiceLocation.PostalCode,
                workOrder.ServiceLocation.Country,
                workOrder.ServiceLocation.AccessInstructions,
                workOrder.DueUtc,
                workOrder.ScheduledStartUtc,
                workOrder.ScheduledEndUtc,
                workOrder.StartedUtc,
                workOrder.CompletedUtc
            ))
            .SingleOrDefaultAsync(cancellationToken);
    }
}