using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.WorkOrderAssignments;
using ServiceFlow.Api.Data;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.WorkOrderAssignments;

public sealed class WorkOrderAssignmentService(
    ApplicationDbContext dbContext,
    UserManager<ApplicationUser> userManager,
    ICurrentOrganization currentOrganization
) : IWorkOrderAssignmentService
{
    public async Task<GetWorkOrderAssignmentsResult> GetAllAsync(Guid workOrderId, CancellationToken cancellationToken)
    {
        var organizationId = currentOrganization.OrganizationId;

        var workOrderExists = await dbContext.WorkOrders.AnyAsync(
            workOrder => workOrder.Id == workOrderId && workOrder.OrganizationId == organizationId,
            cancellationToken
        );

        if (!workOrderExists)
        {
            return new GetWorkOrderAssignmentsResult(
                WorkOrderAssignmentStatus.WorkOrderNotFound,
                []
            );
        }

        var assignments = await dbContext.WorkOrderAssignments
            .AsNoTracking()
            .Where(
                assignment => 
                    assignment.WorkOrderId == workOrderId && 
                    assignment.OrganizationId == organizationId
            )
            .OrderBy(assignment => assignment.AssignedUtc)
            .Select(assignment => new WorkOrderAssignmentResponse(
                assignment.TechnicianId,
                assignment.Technician.DisplayName,
                assignment.Technician.Email ?? string.Empty,
                assignment.AssignedUtc
            ))
            .ToListAsync(cancellationToken);

        return new GetWorkOrderAssignmentsResult(
            WorkOrderAssignmentStatus.Success,
            assignments
        );
    }

    public async Task<AssignWorkOrderTechnicianResult> AssignAsync(
        Guid workOrderId, 
        AssignWorkOrderTechnicianRequest request, 
        CancellationToken cancellationToken
    )
    {
        var organizationId = currentOrganization.OrganizationId;

        var workOrder = await dbContext.WorkOrders
            .Include(workOrder => workOrder.ServiceLocation)
            .ThenInclude(serviceLocation => serviceLocation.Customer)
            .SingleOrDefaultAsync(
                workOrder => 
                    workOrder.Id == workOrderId && 
                    workOrder.OrganizationId == organizationId,
                cancellationToken
            );

        if (workOrder is null)
        {
            return new AssignWorkOrderTechnicianResult(
                WorkOrderAssignmentStatus.WorkOrderNotFound,
                null
            );
        }

        if (!workOrder.ServiceLocation.IsActive)
        {
            return new AssignWorkOrderTechnicianResult(
                WorkOrderAssignmentStatus.ServiceLocationInactive,
                null
            );
        }

        if (!workOrder.ServiceLocation.Customer.IsActive)
        {
            return new AssignWorkOrderTechnicianResult(
                WorkOrderAssignmentStatus.CustomerInactive,
                null
            );
        }

        if (workOrder.Status != WorkOrderStatus.Scheduled)
        {
            return new AssignWorkOrderTechnicianResult(
                WorkOrderAssignmentStatus.WorkOrderNotAssignable,
                null
            );
        }

        var technician = await dbContext.Users.SingleOrDefaultAsync(
            user =>
                user.Id == request.TechnicianId &&
                user.OrganizationId == organizationId,
            cancellationToken 
        );

        if (technician is null)
        {
            return new AssignWorkOrderTechnicianResult(
                WorkOrderAssignmentStatus.TechnicianNotFound,
                null
            );
        }

        if (!await userManager.IsInRoleAsync(technician, ApplicationRoles.Technician))
        {
            return new AssignWorkOrderTechnicianResult(
                WorkOrderAssignmentStatus.TechnicianNotEligible,
                null
            );
        }

        var alreadyAssigned = await dbContext.WorkOrderAssignments.AnyAsync(
            assignment =>
                assignment.TechnicianId == technician.Id &&
                assignment.WorkOrderId == workOrderId,
            cancellationToken
        );

        if (alreadyAssigned)
        {
            return new AssignWorkOrderTechnicianResult(
                WorkOrderAssignmentStatus.AlreadyAssigned,
                null
            );
        }

        var assignment = new WorkOrderAssignment
        {
            WorkOrderId = workOrderId,
            TechnicianId = technician.Id,
            OrganizationId = organizationId,
            AssignedUtc = DateTime.UtcNow
        };

        dbContext.WorkOrderAssignments.Add(assignment);

        await dbContext.SaveChangesAsync(cancellationToken);

        return new AssignWorkOrderTechnicianResult(
            WorkOrderAssignmentStatus.Success,
            ToResponse(assignment, technician)
        );
    }

    public async Task<WorkOrderAssignmentStatus> RemoveAsync(Guid workOrderId, string technicianId, CancellationToken cancellationToken)
    {
        var organizationId = currentOrganization.OrganizationId;

        var workOrder = await dbContext.WorkOrders
            .SingleOrDefaultAsync(
                workOrder =>
                    workOrder.Id == workOrderId &&
                    workOrder.OrganizationId == organizationId,
                cancellationToken
            );

        if (workOrder is null)
        {
            return WorkOrderAssignmentStatus.WorkOrderNotFound;
        }

        if (workOrder.Status != WorkOrderStatus.Scheduled)
        {
            return WorkOrderAssignmentStatus.WorkOrderNotAssignable;
        }

        var assignment = await dbContext.WorkOrderAssignments
            .SingleOrDefaultAsync(
                assignment =>
                    assignment.WorkOrderId == workOrder.Id &&
                    assignment.TechnicianId == technicianId &&
                    assignment.OrganizationId == organizationId,
                cancellationToken
            );
        
        if (assignment is null)
        {
            return WorkOrderAssignmentStatus.AssignmentNotFound;
        }

        dbContext.WorkOrderAssignments.Remove(assignment);

        await dbContext.SaveChangesAsync(cancellationToken);

        return WorkOrderAssignmentStatus.Success;
    }

    private static WorkOrderAssignmentResponse ToResponse(WorkOrderAssignment assignment, ApplicationUser technician)
    {
        return new WorkOrderAssignmentResponse(
            technician.Id,
            technician.DisplayName,
            technician.Email ?? string.Empty,
            assignment.AssignedUtc
        );
    }
}