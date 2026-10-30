using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.WorkOrderAttachments;
using ServiceFlow.Api.Services.WorkOrderAttachments;

namespace ServiceFlow.Api.Controllers;

[ApiController]
[Route("api/technician/work-orders/{workOrderId:guid}/attachments")]
[Authorize(Policy = OrganizationPolicies.ExecuteAssignedWork)]
public sealed class TechnicianWorkOrderAttachmentsController(
    IWorkOrderAttachmentService attachmentService
) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<WorkOrderAttachmentResponse>), StatusCodes.Status200OK)]    
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<WorkOrderAttachmentResponse>>> GetAll(
        Guid workOrderId,
        CancellationToken cancellationToken
    )
    {
        var attachments = await attachmentService.GetForTechnicianAsync(workOrderId, cancellationToken);

        return attachments is null ? NotFound() : Ok(attachments);
    }

    [HttpPost]
    [RequestFormLimits(MultipartBodyLengthLimit = WorkOrderAttachmentFilePolicy.MaxMultipartBodySizeBytes)]
    [ProducesResponseType(typeof(WorkOrderAttachmentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status502BadGateway)]
    public async Task<ActionResult<WorkOrderAttachmentResponse>> Upload(
        Guid workOrderId,
        [FromForm] IFormFile? file,
        CancellationToken cancellationToken
    )
    {
        var result = await attachmentService.UploadForTechnicianAsync(workOrderId, file, cancellationToken);

        if (result.Status == WorkOrderAttachmentMutationStatus.Success)
        {
            return CreatedAtAction(
                nameof(GetAll),
                new { workOrderId },
                result.Attachment
            );
        }

        if (result.Status == WorkOrderAttachmentMutationStatus.InvalidFile)
        {
            return ValidationProblem(
                new ValidationProblemDetails(
                    new Dictionary<string, string[]>
                    {
                        ["file"] = [result.ErrorMessage!]
                    }
                )
            );
        }

        if (result.Status == WorkOrderAttachmentMutationStatus.WorkOrderNotFound)
        {
            return NotFound();
        }

        if (result.Status == WorkOrderAttachmentMutationStatus.WorkOrderNotInProgress)
        {
            return Conflict(
                new ProblemDetails
                {
                    Title = "Work Order cannot accept attachments.",
                    Detail = "Technicians can upload attachments only while an assigned Work Order is In Progress.",
                    Status = StatusCodes.Status409Conflict
                }
            );
        }

        if (result.Status == WorkOrderAttachmentMutationStatus.AttachmentLimitReached)
        {
            return Conflict(
                new ProblemDetails
                {
                    Title = "Attachment limit reached.",
                    Detail = "A Work Order can have at most 15 attachments.",
                    Status = StatusCodes.Status409Conflict
                }
            );
        }

        if (result.Status == WorkOrderAttachmentMutationStatus.StorageFailure)
        {
            return StatusCode(
                StatusCodes.Status502BadGateway,
                new ProblemDetails
                {
                    Title = "Attachment upload failed.",
                    Detail = "The attachment could not be stored. Please try again.",
                    Status = StatusCodes.Status502BadGateway
                }
            );
        }

        throw new InvalidOperationException($"Unexpected result status: {result.Status}");
    }

    [HttpGet("{attachmentId:guid}/download")]
    [ProducesResponseType(StatusCodes.Status302Found)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Download(
        Guid workOrderId,
        Guid attachmentId,
        CancellationToken cancellationToken
    )
    {
        var downloadUrl = await attachmentService.GetDownloadUrlForTechnicianAsync(workOrderId, attachmentId, cancellationToken);

        return downloadUrl is null ? NotFound() : Redirect(downloadUrl);
    }
}