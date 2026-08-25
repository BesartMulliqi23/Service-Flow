using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.WorkOrderAssignments;
using ServiceFlow.Api.Services.WorkOrderAssignments;

namespace ServiceFlow.Api.Controllers;

[ApiController]
[Route("api/work-orders/{workOrderId:guid}/assignments")]
[Authorize(Policy = OrganizationPolicies.ManageWorkOrders)]
public sealed class WorkOrderAssignmentsController(
    IWorkOrderAssignmentService workOrderAssignmentService
) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<WorkOrderAssignmentResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<WorkOrderAssignmentResponse>>> GetAll(
        Guid workOrderId,
        CancellationToken cancellationToken
    )
    {
        var result = await workOrderAssignmentService.GetAllAsync(workOrderId, cancellationToken);

        return result.Status == WorkOrderAssignmentStatus.WorkOrderNotFound
            ? NotFound()
            : Ok(result.Assignments);
    }

    [HttpPost]
    [ProducesResponseType(typeof(WorkOrderAssignmentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<WorkOrderAssignmentResponse>> Assign(
        Guid workOrderId,
        AssignWorkOrderTechnicianRequest request,
        CancellationToken cancellationToken
    )
    {
        if (string.IsNullOrWhiteSpace(request.TechnicianId))
        {
            return ValidationProblem(new ValidationProblemDetails(
                new Dictionary<string, string[]>
                {
                    ["technicianId"] = ["A technician ID is required."]
                }
            ));
        }

        var result = await workOrderAssignmentService.AssignAsync(
            workOrderId, 
            request with { TechnicianId = request.TechnicianId.Trim() }, 
            cancellationToken
        );

        if (result.Status == WorkOrderAssignmentStatus.Success)
        {
            return CreatedAtAction(
                nameof(GetAll),
                new { workOrderId },
                result.Assignment 
            );
        }

        if (result.Status == WorkOrderAssignmentStatus.WorkOrderNotFound || 
            result.Status == WorkOrderAssignmentStatus.TechnicianNotFound)
        {
            return NotFound();
        }

        if (result.Status == WorkOrderAssignmentStatus.TechnicianNotEligible)
        {
            return Conflict(
                new ProblemDetails
                {
                    Title = "User is not a Technician.",
                    Detail = "Only organization members with the Technician role can be assigned.",
                    Status = StatusCodes.Status409Conflict
                }
            );
        }

        if (result.Status == WorkOrderAssignmentStatus.AlreadyAssigned)
        {
            return Conflict(
                new ProblemDetails
                {
                    Title = "Technician is already assigned.",
                    Detail = "The Technician already has an assignment for this Work Order.",
                    Status = StatusCodes.Status409Conflict
                }
            );
        }

        if (result.Status == WorkOrderAssignmentStatus.WorkOrderNotAssignable)
        {
            return Conflict(
                new ProblemDetails
                {
                    Title = "Work order cannot be assigned.",
                    Detail = "Only Scheduled Work Orders can receive Technician assignments.",
                    Status = StatusCodes.Status409Conflict
                }
            );
        }

        if (result.Status == WorkOrderAssignmentStatus.ServiceLocationInactive)
        {
            return Conflict(
                new ProblemDetails
                {
                    Title = "Service location is inactive.",
                    Detail = "A Work Order at an inactive Service Location cannot receive assignments.",
                    Status = StatusCodes.Status409Conflict
                }
            );
        }

        if (result.Status == WorkOrderAssignmentStatus.CustomerInactive)
        {
            return Conflict(
                new ProblemDetails
                {
                    Title = "Customer is inactive.",
                    Detail = "A Work Order at an inactive Customer cannot receive assignments.",
                    Status = StatusCodes.Status409Conflict
                }
            );
        }

        throw new InvalidOperationException($"Unexpected result status: {result.Status}");
    }

    [HttpDelete("{technicianId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Remove(Guid workOrderId, string technicianId, CancellationToken cancellationToken)
    {
        var status = await workOrderAssignmentService.RemoveAsync(workOrderId, technicianId, cancellationToken);

        if (status == WorkOrderAssignmentStatus.Success)
        {
            return NoContent();
        }

        if (status == WorkOrderAssignmentStatus.WorkOrderNotFound ||
            status == WorkOrderAssignmentStatus.AssignmentNotFound)
        {
            return NotFound();
        }

        if (status == WorkOrderAssignmentStatus.WorkOrderNotAssignable)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Work Order assignment cannot be removed.",
                Detail = "Assignments can only be changed while the Work Order is Scheduled.",
                Status = StatusCodes.Status409Conflict
            });
        }

        throw new InvalidOperationException($"Unexpected result status: {status}");
    }
}