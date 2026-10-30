using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.WorkOrderAttachments;
using ServiceFlow.Api.Services.WorkOrderAttachments;

namespace ServiceFlow.Api.Controllers;

[ApiController]
[Route("api/workorders/{workOrderId:guid}/attachments")]
[Authorize(Policy = OrganizationPolicies.ManageWorkOrders)]
public sealed class WorkOrderAttachmentsController(
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
        var attachments = await attachmentService.GetForOperationsAsync(workOrderId, cancellationToken);

        return attachments is null ? NotFound() : Ok(attachments);
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
        var downloadUrl = await attachmentService.GetDownloadUrlForOperationsAsync(workOrderId, attachmentId, cancellationToken);

        return downloadUrl is null ? NotFound() : Redirect(downloadUrl);
    }
}