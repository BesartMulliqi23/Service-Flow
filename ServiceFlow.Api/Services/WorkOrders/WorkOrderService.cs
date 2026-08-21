using Microsoft.EntityFrameworkCore;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.WorkOrders;
using ServiceFlow.Api.Data;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.WorkOrders;

public sealed class WorkOrderService(
    ApplicationDbContext dbContext,
    ICurrentOrganization currentOrganization
) : IWorkOrderService
{
    public async Task<CreateWorkOrderResult> CreateAsync(CreateWorkOrderRequest request, CancellationToken cancellationToken)
    {
        var organizationId = currentOrganization.OrganizationId;

        var serviceLocation = await dbContext.ServiceLocations
            .Include(serviceLocation => serviceLocation.Customer)
            .SingleOrDefaultAsync(
                serviceLocation =>  serviceLocation.Id == request.ServiceLocationId &&
                                    serviceLocation.OrganizationId == organizationId,
                cancellationToken
            );

        if (serviceLocation is null)
        {
            return new CreateWorkOrderResult(CreateWorkOrderStatus.ServiceLocationNotFound, null);
        }

        if (!serviceLocation.IsActive)
        {
            return new CreateWorkOrderResult(CreateWorkOrderStatus.ServiceLocationInactive, null);
        }

        if (!serviceLocation.Customer.IsActive)
        {
            return new CreateWorkOrderResult(CreateWorkOrderStatus.CustomerInactive, null);
        }

        var workOrder = new WorkOrder
        {
            OrganizationId = organizationId,
            ServiceLocationId = serviceLocation.Id,
            Title = request.Title!.Trim(),
            Description = request.Description!.Trim(),
            Priority = request.Priority,
            Status = WorkOrderStatus.Draft,
            DueUtc = request.DueUtc,
            CreatedUtc = DateTime.UtcNow
        };

        dbContext.WorkOrders.Add(workOrder);

        await dbContext.SaveChangesAsync(cancellationToken);

        return new CreateWorkOrderResult(CreateWorkOrderStatus.Success, ToResponse(workOrder, serviceLocation));
    }

    public async Task<IReadOnlyList<WorkOrderResponse>> GetAllAsync(
        Guid? serviceLocationId, 
        WorkOrderStatus? status, 
        CancellationToken cancellationToken
    )
    {
        var organizationId = currentOrganization.OrganizationId;

        var query = dbContext.WorkOrders
            .AsNoTracking()
            .Where(workOrder => workOrder.OrganizationId == organizationId);

        if (serviceLocationId.HasValue)
        {
            query = query.Where(
                workOrder => workOrder.ServiceLocationId == serviceLocationId.Value
            );
        }

        if (status.HasValue)
        {
            query = query.Where(
                workOrder => workOrder.Status == status.Value
            );
        }

        return await query
            .OrderByDescending(workOrder => workOrder.CreatedUtc)
            .Select(workOrder => new WorkOrderResponse(
                workOrder.Id,
                workOrder.ServiceLocationId,
                workOrder.ServiceLocation.Name,
                workOrder.ServiceLocation.CustomerId,
                workOrder.ServiceLocation.Customer.Name,
                workOrder.Title,
                workOrder.Description,
                workOrder.Priority,
                workOrder.Status,
                workOrder.DueUtc,
                workOrder.ScheduledStartUtc,
                workOrder.ScheduledEndUtc,
                workOrder.CreatedUtc,
                workOrder.UpdatedUtc
            ))
            .ToListAsync(cancellationToken);
    }

    public async Task<WorkOrderResponse?> GetByIdAsync(Guid workOrderId, CancellationToken cancellationToken)
    {
        var organizationId = currentOrganization.OrganizationId;

        var workOrder = await dbContext.WorkOrders
            .AsNoTracking()
            .Include(workOrder => workOrder.ServiceLocation)
            .ThenInclude(serviceLocation => serviceLocation.Customer)
            .SingleOrDefaultAsync(
                workOrder =>    workOrder.Id == workOrderId &&
                                workOrder.OrganizationId == organizationId,
                cancellationToken
            );

        return workOrder is null ? null : ToResponse(workOrder, workOrder.ServiceLocation);
    }

    public async Task<UpdateWorkOrderResult> UpdateAsync(
        Guid workOrderId, 
        UpdateWorkOrderRequest request, 
        CancellationToken cancellationToken
    )
    {
        var organizationId = currentOrganization.OrganizationId;

        var workOrder = await dbContext.WorkOrders
            .Include(workOrder => workOrder.ServiceLocation)
            .ThenInclude(serviceLocation => serviceLocation.Customer)
            .SingleOrDefaultAsync(
                workOrder =>    workOrder.Id == workOrderId &&
                                workOrder.OrganizationId == organizationId,
                cancellationToken
            );

        if (workOrder is null)
        {
            return new UpdateWorkOrderResult(UpdateWorkOrderStatus.NotFound, null);
        }

        if (workOrder.Status != WorkOrderStatus.Draft)
        {
            return new UpdateWorkOrderResult(UpdateWorkOrderStatus.NotDraft, ToResponse(workOrder, workOrder.ServiceLocation));
        }

        workOrder.Title = request.Title!.Trim();
        workOrder.Description = request.Description!.Trim();
        workOrder.Priority = request.Priority;
        workOrder.DueUtc = request.DueUtc;
        workOrder.UpdatedUtc = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        return new UpdateWorkOrderResult(UpdateWorkOrderStatus.Success, ToResponse(workOrder, workOrder.ServiceLocation));
    }

    private static WorkOrderResponse ToResponse(WorkOrder workOrder, ServiceLocation serviceLocation)
    {
        return new WorkOrderResponse(
            workOrder.Id,
            serviceLocation.Id,
            serviceLocation.Name,
            serviceLocation.CustomerId,
            serviceLocation.Customer.Name,
            workOrder.Title,
            workOrder.Description,
            workOrder.Priority,
            workOrder.Status,
            workOrder.DueUtc,
            workOrder.ScheduledStartUtc,
            workOrder.ScheduledEndUtc,
            workOrder.CreatedUtc,
            workOrder.UpdatedUtc
        );
    }
}