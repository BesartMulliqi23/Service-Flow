using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.TechnicianWorkOrders;
using ServiceFlow.Api.Models;
using ServiceFlow.Api.Services.TechnicianWorkOrders;

namespace ServiceFlow.Api.Controllers;

[ApiController]
[Route("api/technician/work-order")]
[Authorize(Policy = OrganizationPolicies.ExecuteAssignedWork)]
public sealed class TechnicianWorkOrdersController(
    ITechnicianWorkOrderService technicianWorkOrderService
) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<TechnicianWorkOrderResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<TechnicianWorkOrderResponse>>> GetAll(
        [FromQuery] WorkOrderStatus? status,
        CancellationToken cancellationToken
    )
    {
        var workOrders = await technicianWorkOrderService.GetAllAsync(status, cancellationToken);

        return Ok(workOrders);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(TechnicianWorkOrderResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TechnicianWorkOrderResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var workOrder = await technicianWorkOrderService.GetByIdAsync(id, cancellationToken);

        return workOrder == null ? NotFound() : Ok(workOrder);
    }

    [HttpPost("{id:guid}/start")]
    [ProducesResponseType(typeof(TechnicianWorkOrderResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<TechnicianWorkOrderResponse>> Start(Guid id, CancellationToken cancellationToken)
    {
        var result = await technicianWorkOrderService.StartAsync(id, cancellationToken);

        if (result.Status == TechnicianWorkOrderExecutionStatus.Success)
        {
            return Ok(result.WorkOrder);
        }

        if (result.Status == TechnicianWorkOrderExecutionStatus.NotFound)
        {
            return NotFound();
        }

        if (result.Status == TechnicianWorkOrderExecutionStatus.InvalidTransition)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Work order cannot be started.",
                Detail = "Only Scheduled Work Orders can be started.",
                Status = StatusCodes.Status409Conflict
            });
        }

        throw new InvalidOperationException($"Unexpected result status: {result.Status}");
    }

    [HttpPost("{id:guid}/complete")]
    [ProducesResponseType(typeof(TechnicianWorkOrderResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<TechnicianWorkOrderResponse>> Complete(
        Guid id,
        CompleteWorkOrderRequest request,
        CancellationToken cancellationToken
    )
    {
        var errors = ValidateCompletionInput(request.CompletionNote);

        if (errors.Count > 0)
        {
            return ValidationProblem(new ValidationProblemDetails(errors));
        }

        var result = await technicianWorkOrderService.CompleteAsync(id, request, cancellationToken);

        if (result.Status == TechnicianWorkOrderExecutionStatus.Success)
        {
            return Ok(result.WorkOrder);
        }

        if (result.Status == TechnicianWorkOrderExecutionStatus.NotFound)
        {
            return NotFound();
        }

        if (result.Status == TechnicianWorkOrderExecutionStatus.InvalidTransition)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Work Order cannot be completed.",
                Detail = "Only In Progress Work Orders can be completed.",
                Status = StatusCodes.Status409Conflict
            });
        }

        throw new InvalidOperationException($"Unexpected result status: {result.Status}");
    }

    private static Dictionary<string, string[]> ValidateCompletionInput(string? completionNote)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(completionNote))
        {
            errors["completionNote"] = ["A completion note is required."];
        }
        else if (completionNote.Trim().Length > 4000)
        {
            errors["completionNote"] = ["Completion note cannot exceed 4000 characters."];
        }

        return errors;
    }
}