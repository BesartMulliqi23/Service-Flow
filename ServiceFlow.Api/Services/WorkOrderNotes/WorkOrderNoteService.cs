using Microsoft.EntityFrameworkCore;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.WorkOrderNotes;
using ServiceFlow.Api.Data;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.WorkOrderNotes;

public sealed class WorkOrderNoteService(
    ApplicationDbContext dbContext,
    ICurrentOrganization currentOrganization
) : IWorkOrderNoteService
{
    public async Task<IReadOnlyList<WorkOrderNoteResponse>?> GetForTechnicianAsync(
        Guid workOrderId, 
        CancellationToken cancellationToken
    )
    {
        var organizationId = currentOrganization.OrganizationId;
        var technicianId = currentOrganization.UserId;

        var hasAccess = await dbContext.WorkOrders
            .AsNoTracking()
            .AnyAsync(
                workOrder =>
                    workOrder.Id == workOrderId &&
                    workOrder.OrganizationId == organizationId &&
                    workOrder.Assignments.Any(
                        assignment =>
                            assignment.OrganizationId == organizationId &&
                            assignment.TechnicianId == technicianId
                    ),
                cancellationToken
            );

        if (!hasAccess)
        {
            return null;
        }

        return await GetNotesAsync(organizationId, workOrderId, cancellationToken);
    }

    public async Task<IReadOnlyList<WorkOrderNoteResponse>?> GetForOperationsAsync(
        Guid workOrderId, 
        CancellationToken cancellationToken)
    {
        var organizationId = currentOrganization.OrganizationId;

        var exists = await dbContext.WorkOrders
            .AsNoTracking()
            .AnyAsync(
                workOrder =>
                    workOrder.Id == workOrderId &&
                    workOrder.OrganizationId == organizationId,
                cancellationToken
            );

        if (!exists)
        {
            return null;
        }

        return await GetNotesAsync(organizationId, workOrderId, cancellationToken);
    }

    public async Task<WorkOrderNoteMutationResult> CreateForTechnicianAsync(
        Guid workOrderId, 
        string content, 
        CancellationToken cancellationToken
    )
    {
        var organizationId = currentOrganization.OrganizationId;
        var technicianId = currentOrganization.UserId;

        var workOrder = await dbContext.WorkOrders
            .SingleOrDefaultAsync(
                workOrder =>
                    workOrder.Id == workOrderId &&
                    workOrder.OrganizationId == organizationId &&
                    workOrder.Assignments.Any(
                        assignment =>
                            assignment.OrganizationId == organizationId &&
                            assignment.TechnicianId == technicianId
                    ),
                cancellationToken
            );

        if (workOrder is null)
        {
            return new WorkOrderNoteMutationResult(
                WorkOrderNoteMutationStatus.WorkOrderNotFound,
                null
            );
        }

        if (workOrder.Status != WorkOrderStatus.InProgress)
        {
            return new WorkOrderNoteMutationResult(
                WorkOrderNoteMutationStatus.WorkOrderNotInProgress,
                null
            );
        }

        var technician = await dbContext.Users
            .AsNoTracking()
            .SingleAsync(
                user =>
                    user.Id == technicianId &&
                    user.OrganizationId == organizationId,
                cancellationToken
            );

        var note = new WorkOrderNote
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            WorkOrderId = workOrderId,
            CreatedByUserId = technicianId,
            Content = content.Trim(),
            CreatedUtc = DateTime.UtcNow
        };

        dbContext.WorkOrderNotes.Add(note);
        
        await dbContext.SaveChangesAsync(cancellationToken);

        return new WorkOrderNoteMutationResult(
            WorkOrderNoteMutationStatus.Success,
            new WorkOrderNoteResponse(
                note.Id,
                note.Content,
                technician.DisplayName,
                note.CreatedUtc
            )
        );
    }

    private async Task<IReadOnlyList<WorkOrderNoteResponse>> GetNotesAsync(
        Guid organizationId,
        Guid workOrderId,
        CancellationToken cancellationToken
    )
    {
        return await dbContext.WorkOrderNotes
            .AsNoTracking()
            .Where(
                note =>
                    note.OrganizationId == organizationId &&
                    note.WorkOrderId == workOrderId
            )
            .OrderByDescending(note => note.CreatedUtc)
            .Select(note => new WorkOrderNoteResponse(
                note.Id,
                note.Content,
                note.CreatedByUser.DisplayName,
                note.CreatedUtc
            ))
            .ToListAsync(cancellationToken);
    }
}