using Microsoft.EntityFrameworkCore;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.Materials;
using ServiceFlow.Api.Data;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.Materials;

public sealed class WorkOrderMaterialService(
    ApplicationDbContext dbContext,
    ICurrentOrganization currentOrganization,
    IHttpContextAccessor httpContextAccessor
) : IWorkOrderMaterialService
{
    public async Task<GetWorkOrderMaterialsResult> GetAllAsync(
        Guid workOrderId, 
        CancellationToken cancellationToken
    )
    {
        var workOrder = await FindAccessibleWorkOrderAsync(workOrderId, cancellationToken);

        if (workOrder is null)
        {
            return new GetWorkOrderMaterialsResult(
                WorkOrderMaterialOperationStatus.WorkOrderNotFound,
                []
            );
        }

        var organizationId = currentOrganization.OrganizationId;

        var materials = await dbContext.WorkOrderMaterials
            .AsNoTracking()
            .Where(
                material =>
                    material.OrganizationId == organizationId &&
                    material.WorkOrderId == workOrderId
            )
            .OrderBy(material => material.AddedUtc)
            .Select(material => new WorkOrderMaterialResponse(
                material.Id,
                material.MaterialId,
                material.MaterialName,
                material.UnitOfMeasure,
                material.Quantity,
                material.UnitCost,
                material.UnitCost * material.Quantity,
                material.AddedUtc,
                material.UpdatedUtc
            ))
            .ToListAsync(cancellationToken);

        return new GetWorkOrderMaterialsResult(
            WorkOrderMaterialOperationStatus.Success,
            materials
        );
    }

    public async Task<WorkOrderMaterialMutationResult> AddAsync(
        Guid workOrderId, 
        AddWorkOrderMaterialRequest request, 
        CancellationToken cancellationToken
    )
    {
        var workOrder = await FindAccessibleWorkOrderAsync(workOrderId, cancellationToken);

        if (workOrder is null)
        {
            return new WorkOrderMaterialMutationResult(
                WorkOrderMaterialOperationStatus.WorkOrderNotFound,
                null
            );
        }

        if (!CanModifyMaterials(workOrder))
        {
            return new WorkOrderMaterialMutationResult(
                WorkOrderMaterialOperationStatus.WorkOrderNotInProgress,
                null
            );
        }

        var organizationId = currentOrganization.OrganizationId;

        var material = await dbContext.Materials
            .SingleOrDefaultAsync(
                material =>
                    material.OrganizationId == organizationId &&
                    material.Id == request.MaterialId,
                cancellationToken
            );

        if (material is null)
        {
            return new WorkOrderMaterialMutationResult(
                WorkOrderMaterialOperationStatus.MaterialNotFound,
                null
            );
        }

        if (!material.IsActive)
        {
            return new WorkOrderMaterialMutationResult(
                WorkOrderMaterialOperationStatus.MaterialInactive,
                null
            );
        }

        var lineAlreadyExists = await dbContext.WorkOrderMaterials.AnyAsync(
            usage =>
                usage.OrganizationId == organizationId &&
                usage.WorkOrderId == workOrderId &&
                usage.MaterialId == request.MaterialId,
            cancellationToken
        );

        if (lineAlreadyExists)
        {
            return new WorkOrderMaterialMutationResult(
                WorkOrderMaterialOperationStatus.DuplicateMaterialLine,
                null
            );
        }

        var now = DateTime.UtcNow;

        var usage = new WorkOrderMaterial
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            WorkOrderId = workOrderId,
            MaterialId = request.MaterialId,
            MaterialName = material.Name,
            UnitOfMeasure = material.UnitOfMeasure,
            Quantity = request.Quantity!.Value,
            UnitCost = request.UnitCost ?? material.DefaultUnitCost,
            AddedUtc = now
        };

        dbContext.WorkOrderMaterials.Add(usage);

        await dbContext.SaveChangesAsync(cancellationToken);

        return new WorkOrderMaterialMutationResult(
            WorkOrderMaterialOperationStatus.Success,
            ToResponse(usage)
        );
    }

    public async Task<WorkOrderMaterialMutationResult> UpdateAsync(
        Guid workOrderId, 
        Guid workOrderMaterialId, 
        UpdateWorkOrderMaterialRequest request, 
        CancellationToken cancellationToken
    )
    {
        var workOrder = await FindAccessibleWorkOrderAsync(workOrderId, cancellationToken);

        if (workOrder is null)
        {
            return new WorkOrderMaterialMutationResult(
                WorkOrderMaterialOperationStatus.WorkOrderNotFound,
                null
            );
        }

        if (!CanModifyMaterials(workOrder))
        {
            return new WorkOrderMaterialMutationResult(
                WorkOrderMaterialOperationStatus.WorkOrderNotInProgress,
                null
            );
        }

        var organizationId = currentOrganization.OrganizationId;
        
        var usage = await dbContext.WorkOrderMaterials
            .SingleOrDefaultAsync(
                material =>
                    material.OrganizationId == organizationId &&
                    material.WorkOrderId == workOrderId &&
                    material.Id == workOrderMaterialId,
                cancellationToken
            );

        if (usage is null)
        {
            return new WorkOrderMaterialMutationResult(
                WorkOrderMaterialOperationStatus.UsageLineNotFound,
                null
            );
        }

        usage.Quantity = request.Quantity!.Value;

        if (request.UnitCost.HasValue)
        {
            usage.UnitCost = request.UnitCost.Value;
        }

        usage.UpdatedUtc = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        return new WorkOrderMaterialMutationResult(
            WorkOrderMaterialOperationStatus.Success,
            ToResponse(usage)
        );
    }

    public async Task<WorkOrderMaterialOperationStatus> RemoveAsync(
        Guid workOrderId, 
        Guid workOrderMaterialId, 
        CancellationToken cancellationToken
    )
    {
        var workOrder = await FindAccessibleWorkOrderAsync(workOrderId, cancellationToken);

        if (workOrder is null)
        {
            return WorkOrderMaterialOperationStatus.WorkOrderNotFound;
        }

        if (!CanModifyMaterials(workOrder))
        {
            return WorkOrderMaterialOperationStatus.WorkOrderNotInProgress;
        }

        var organizationId = currentOrganization.OrganizationId;

        var usage = await dbContext.WorkOrderMaterials
            .SingleOrDefaultAsync(
                material =>
                    material.OrganizationId == organizationId &&
                    material.WorkOrderId == workOrderId &&
                    material.Id == workOrderMaterialId,
                cancellationToken
            );

        if (usage is null)
        {
            return WorkOrderMaterialOperationStatus.UsageLineNotFound;
        }

        dbContext.WorkOrderMaterials.Remove(usage);

        await dbContext.SaveChangesAsync(cancellationToken);

        return WorkOrderMaterialOperationStatus.Success;
    }

    private async Task<WorkOrder?> FindAccessibleWorkOrderAsync(
        Guid workOrderId,
        CancellationToken cancellationToken
    )
    {
        var organizationId = currentOrganization.OrganizationId;

        var query = dbContext.WorkOrders
            .Where(
                workOrder =>
                    workOrder.OrganizationId == organizationId &&
                    workOrder.Id == workOrderId
            );

        if (!IsOperationsManager())
        {
            var userId = currentOrganization.UserId;

            query = query.Where(
                workOrder =>
                    workOrder.Assignments.Any(
                        assignment =>
                            assignment.OrganizationId == organizationId &&
                            assignment.TechnicianId == userId
                    )
            );
        }

        return await query.SingleOrDefaultAsync(cancellationToken);
    }

    private bool CanModifyMaterials(WorkOrder workOrder)
    {
        return IsOperationsManager() || workOrder.Status == WorkOrderStatus.InProgress;
    }

    private bool IsOperationsManager()
    {
        var user = httpContextAccessor.HttpContext?.User
            ?? throw new InvalidOperationException("A material usage operation requires an authenticated user.");

        return OrganizationPolicies.OperationsManagers.Any(user.IsInRole);
    } 

    private static WorkOrderMaterialResponse ToResponse(WorkOrderMaterial material)
    {
        return new WorkOrderMaterialResponse(
            material.Id,
            material.MaterialId,
            material.MaterialName,
            material.UnitOfMeasure,
            material.Quantity,
            material.UnitCost,
            material.Quantity * material.UnitCost,
            material.AddedUtc,
            material.UpdatedUtc 
        );
    }
}