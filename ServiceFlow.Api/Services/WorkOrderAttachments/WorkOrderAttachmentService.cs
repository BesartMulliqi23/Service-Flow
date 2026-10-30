using Microsoft.EntityFrameworkCore;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.WorkOrderAttachments;
using ServiceFlow.Api.Data;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.WorkOrderAttachments;

public sealed class WorkOrderAttachmentService(
    ApplicationDbContext dbContext,
    ICurrentOrganization currentOrganization,
    IWorkOrderAttachmentStorage attachmentStorage
) : IWorkOrderAttachmentService
{
    public async Task<IReadOnlyList<WorkOrderAttachmentResponse>?> GetForTechnicianAsync(
        Guid workOrderId, 
        CancellationToken cancellationToken
    )
    {
        var workOrder = await FindTechnicianWorkOrderAsync(workOrderId, cancellationToken);

        return workOrder is null
            ? null
            : await GetAttachmentsAsync(workOrderId, cancellationToken);
    }

    public async Task<IReadOnlyList<WorkOrderAttachmentResponse>?> GetForOperationsAsync(
        Guid workOrderId, 
        CancellationToken cancellationToken
    )
    {
        var workOrder = await FindOrganizationWorkOrderAsync(workOrderId, cancellationToken);

        return workOrder is null
            ? null
            : await GetAttachmentsAsync(workOrderId, cancellationToken);
    }

    public async Task<WorkOrderAttachmentMutationResult> UploadForTechnicianAsync(
        Guid workOrderId, 
        IFormFile? file, 
        CancellationToken cancellationToken
    )
    {
        var workOrder = await FindTechnicianWorkOrderAsync(workOrderId, cancellationToken);

        if (workOrder is null)
        {
            return new WorkOrderAttachmentMutationResult(
                WorkOrderAttachmentMutationStatus.WorkOrderNotFound,
                null,
                null
            );
        }

        if (workOrder.Status != WorkOrderStatus.InProgress)
        {
            return new WorkOrderAttachmentMutationResult(
                WorkOrderAttachmentMutationStatus.WorkOrderNotInProgress,
                null,
                null
            );
        }

        if (!WorkOrderAttachmentFilePolicy.TryValidate(
            file,
            out var validatedFile,
            out var validationError
        ))
        {
            return new WorkOrderAttachmentMutationResult(
                WorkOrderAttachmentMutationStatus.InvalidFile,
                null,
                validationError
            );
        }

        var organizationId = currentOrganization.OrganizationId;

        var attachmentCount = await dbContext.WorkOrderAttachments
            .CountAsync(
                attachment =>
                    attachment.WorkOrderId == workOrderId &&
                    attachment.OrganizationId == organizationId,
                cancellationToken
            );

        if (attachmentCount >= WorkOrderAttachmentFilePolicy.MaxAttachmentsPerWorkOrder)
        {
            return new WorkOrderAttachmentMutationResult(
                WorkOrderAttachmentMutationStatus.AttachmentLimitReached,
                null,
                null
            );
        }

        var attachment = new WorkOrderAttachment
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            WorkOrderId = workOrderId,
            UploadedByUserId = currentOrganization.UserId,
            OriginalFileName = validatedFile!.OriginalFileName,
            ContentType = validatedFile.ContentType,
            FileSizeBytes = file!.Length,
            CreatedUtc = DateTime.UtcNow
        };

        StoredWorkOrderAttachment storedAttachment;

        try
        {
            await using var content = file.OpenReadStream();

            storedAttachment = await attachmentStorage.UploadAsync(
                new WorkOrderAttachmentUpload(
                    attachment.Id,
                    organizationId,
                    workOrderId,
                    validatedFile.OriginalFileName,
                    validatedFile.FileExtension,
                    content
                ),
                cancellationToken
            );
        }
        catch (Exception) when (!cancellationToken.IsCancellationRequested)
        {
            return new WorkOrderAttachmentMutationResult(
                WorkOrderAttachmentMutationStatus.StorageFailure,
                null,
                null
            );
        }

        attachment.CloudinaryAssetId = storedAttachment.AssetId;
        attachment.CloudinaryPublicId = storedAttachment.PublicId;
        attachment.CloudinaryResourceType = storedAttachment.ResourceType;

        dbContext.WorkOrderAttachments.Add(attachment);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            try
            {
                await attachmentStorage.DeleteAsync(
                    storedAttachment.PublicId,
                    storedAttachment.ResourceType,
                    cancellationToken
                );
            }
            catch
            {
                // The original persistence failure is more useful to preserve here.
                // An orphaned Cloudinary file can be cleaned up operationally.
            }

            throw;
        }

        var response = await dbContext.WorkOrderAttachments
            .AsNoTracking()
            .Where(storedAttachment => storedAttachment.Id == attachment.Id)
            .Select(storedAttachment => new WorkOrderAttachmentResponse(
                storedAttachment.Id,
                storedAttachment.OriginalFileName,
                storedAttachment.ContentType,
                storedAttachment.FileSizeBytes,
                storedAttachment.UploadedByUser.DisplayName,
                storedAttachment.CreatedUtc
            ))
            .SingleAsync(cancellationToken);

        return new WorkOrderAttachmentMutationResult(
            WorkOrderAttachmentMutationStatus.Success,
            response,
            null
        );
    }

    public async Task<string?> GetDownloadUrlForTechnicianAsync(
        Guid workOrderId, 
        Guid attachmentId, 
        CancellationToken cancellationToken
    )
    {
        var workOrder = await FindTechnicianWorkOrderAsync(workOrderId, cancellationToken);

        return workOrder is null
            ? null
            : await GetDownloadUrlAsync(workOrderId, attachmentId, cancellationToken);
    }

    public async Task<string?> GetDownloadUrlForOperationsAsync(
        Guid workOrderId, 
        Guid attachmentId, 
        CancellationToken cancellationToken
    )
    {
        var workOrder = await FindOrganizationWorkOrderAsync(workOrderId, cancellationToken);

        return workOrder is null
            ? null
            : await GetDownloadUrlAsync(workOrderId, attachmentId, cancellationToken);
    }

    private async Task<IReadOnlyList<WorkOrderAttachmentResponse>> GetAttachmentsAsync(
        Guid workOrderId,
        CancellationToken cancellationToken
    )
    {
        var organizationId = currentOrganization.OrganizationId;

        return await dbContext.WorkOrderAttachments
            .AsNoTracking()
            .Where(
                attachment =>
                    attachment.OrganizationId == organizationId &&
                    attachment.WorkOrderId == workOrderId
            )
            .OrderByDescending(attachment => attachment.CreatedUtc)
            .Select(attachment => new WorkOrderAttachmentResponse(
                attachment.Id,
                attachment.OriginalFileName,
                attachment.ContentType,
                attachment.FileSizeBytes,
                attachment.UploadedByUser.DisplayName,
                attachment.CreatedUtc
            ))
            .ToListAsync(cancellationToken);
    }

    private async Task<string?> GetDownloadUrlAsync(
        Guid workOrderId,
        Guid attachmentId,
        CancellationToken cancellationToken
    )
    {
        var organizationId = currentOrganization.OrganizationId;

        var attachment = await dbContext.WorkOrderAttachments
            .AsNoTracking()
            .SingleOrDefaultAsync(
                attachment =>
                    attachment.Id == attachmentId &&
                    attachment.WorkOrderId == workOrderId &&
                    attachment.OrganizationId == organizationId,
                cancellationToken
            );

        return attachment is null
            ? null
            : attachmentStorage.CreatePrivateDownloadUrl(
                attachment.CloudinaryPublicId,
                attachment.CloudinaryResourceType,
                attachment.OriginalFileName,
                DateTimeOffset.UtcNow.AddMinutes(5)
            );
    }

    private async Task<WorkOrder?> FindTechnicianWorkOrderAsync(
        Guid workOrderId,
        CancellationToken cancellationToken
    )
    {
        var organizationId = currentOrganization.OrganizationId;
        var technicianId = currentOrganization.UserId;

        return await dbContext.WorkOrders
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
    }

    private async Task<WorkOrder?> FindOrganizationWorkOrderAsync(
        Guid workOrderId,
        CancellationToken cancellationToken
    )
    {
        var organizationId = currentOrganization.OrganizationId;

        return await dbContext.WorkOrders
            .SingleOrDefaultAsync(
                workOrder =>
                    workOrder.Id == workOrderId &&
                    workOrder.OrganizationId == organizationId,
                cancellationToken
            );
    }
}