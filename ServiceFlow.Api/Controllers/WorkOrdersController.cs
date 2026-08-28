using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.Scheduling;
using ServiceFlow.Api.Contracts.WorkOrders;
using ServiceFlow.Api.Models;
using ServiceFlow.Api.Services.WorkOrders;

namespace ServiceFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = OrganizationPolicies.ManageWorkOrders)]
public sealed class WorkOrdersController(
    IWorkOrderService workOrderService
) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType(typeof(WorkOrderResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<WorkOrderResponse>> Create(
        CreateWorkOrderRequest request, 
        CancellationToken cancellationToken
    )
    {
        var errors = ValidateWorkOrderInput(request.Title, request.Description, request.Priority);

        if (request.ServiceLocationId == Guid.Empty)
        {
            errors["serviceLocationId"] = ["A service location ID is required."];
        }

        if (errors.Count > 0)
        {
            return ValidationProblem(new ValidationProblemDetails(errors));
        }

        var result = await workOrderService.CreateAsync(request, cancellationToken);

        if (result.Status == CreateWorkOrderStatus.Success)
        {
            return CreatedAtAction(
                nameof(GetById),
                new { workOrderId = result.WorkOrder!.Id },
                result.WorkOrder
            );
        }

        if (result.Status == CreateWorkOrderStatus.ServiceLocationNotFound)
        {
            return NotFound();
        }

        if (result.Status == CreateWorkOrderStatus.ServiceLocationInactive)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Service location is inactive.",
                Detail = "A Work Order cannot be created for an inactive Service Location.",
                Status = StatusCodes.Status409Conflict 
            });
        }

        if (result.Status == CreateWorkOrderStatus.CustomerInactive)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Customer is inactive.",
                Detail = "A Work Order cannot be created for an inactive Customer.",
                Status = StatusCodes.Status409Conflict 
            });
        }

        throw new InvalidOperationException($"Unexpected result status: {result.Status}");
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<WorkOrderResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<WorkOrderResponse>>> GetAll(
        [FromQuery] Guid? serviceLocationId,
        [FromQuery] WorkOrderStatus? status,
        CancellationToken cancellationToken
    )
    {
        var workOrders = await workOrderService.GetAllAsync(serviceLocationId, status, cancellationToken);

        return Ok(workOrders);
    }

    [HttpGet("{workOrderId:guid}")]
    [ProducesResponseType(typeof(WorkOrderResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkOrderResponse>> GetById(Guid workOrderId, CancellationToken cancellationToken)
    {
        var workOrder = await workOrderService.GetByIdAsync(workOrderId, cancellationToken);

        return workOrder is null ? NotFound() : Ok(workOrder);
    }

    [HttpPut("{workOrderId:guid}")]
    [ProducesResponseType(typeof(WorkOrderResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<WorkOrderResponse>> Update(
        Guid workOrderId, 
        UpdateWorkOrderRequest request, 
        CancellationToken cancellationToken
    )
    {
        var errors = ValidateWorkOrderInput(request.Title, request.Description, request.Priority);

        if (errors.Count > 0)
        {
            return ValidationProblem(new ValidationProblemDetails(errors));
        }

        var result = await workOrderService.UpdateAsync(workOrderId, request, cancellationToken);

        if (result.Status == UpdateWorkOrderStatus.Success)
        {
            return Ok(result.WorkOrder);
        }

        if (result.Status == UpdateWorkOrderStatus.NotFound)
        {
            return NotFound();
        }

        if (result.Status == UpdateWorkOrderStatus.NotDraft)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Work Order cannot be updated.",
                Detail = "Only Draft Work Orders can be updated.",
                Status = StatusCodes.Status409Conflict
            });
        }

        throw new InvalidOperationException($"Unexpected result status: {result.Status}");
    }

    [HttpPost("{workOrderId:guid}/schedule")]
    [ProducesResponseType(typeof(WorkOrderResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<WorkOrderResponse>> Schedule(
        Guid workOrderId,
        ScheduleWorkOrderRequest request,
        CancellationToken cancellationToken
    )
    {
        var errors = ValidateScheduleInput(request.ScheduledStartUtc, request.ScheduledEndUtc);

        if (errors.Count > 0)
        {
            return ValidationProblem(new ValidationProblemDetails(errors));
        }

        var result = await workOrderService.ScheduleAsync(workOrderId, request, cancellationToken);

        if (result.Status == ScheduleWorkOrderStatus.Success)
        {
            return Ok(result.WorkOrder);
        }

        if (result.Status == ScheduleWorkOrderStatus.NotFound)
        {
            return NotFound();
        }

        if (result.Status == ScheduleWorkOrderStatus.InvalidSchedule)
        {
            return ValidationProblem(new ValidationProblemDetails(
                new Dictionary<string, string[]>
                {
                    ["scheduledEndUtc"] = ["Scheduled end time must be later than scheduled start time."]
                }
            ));
        }

        if (result.Status == ScheduleWorkOrderStatus.WorkOrderNotSchedulable)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Work Order cannot be scheduled.",
                Detail = "Only Draft or Scheduled Work Orders can be scheduled.",
                Status = StatusCodes.Status409Conflict
            });
        }

        if (result.Status == ScheduleWorkOrderStatus.TechnicianScheduleConflict)
        {
            var problem = new ProblemDetails
            {
                Title = "Technician has a scheduling conflict.",
                Detail = "Rescheduling would overlap an assigned Technician's active Work Order.",
                Status = StatusCodes.Status409Conflict
            };

            problem.Extensions["conflict"] = new TechnicianScheduleConflictDetails(
                result.Conflict!.WorkOrderId,
                result.Conflict.WorkOrderTitle,
                result.Conflict.ScheduledStartUtc,
                result.Conflict.ScheduledEndUtc
            );

            return Conflict(problem);
        }

        if (result.Status == ScheduleWorkOrderStatus.ServiceLocationInactive)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Service location is inactive.",
                Detail = "A Work Order cannot be scheduled for an inactive Service Location.",
                Status = StatusCodes.Status409Conflict
            });
        }

        if (result.Status == ScheduleWorkOrderStatus.CustomerInactive)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Customer is inactive.",
                Detail = "A Work Order cannot be scheduled for an inactive Customer.",
                Status = StatusCodes.Status409Conflict
            });
        }

        throw new InvalidOperationException($"Unexpected result status: {result.Status}");
    }

    private static Dictionary<string, string[]> ValidateWorkOrderInput(
        string? title,
        string? description,
        WorkOrderPriority priority
    )
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(title))
        {
            errors["title"] = ["A title is required."];
        }
        else if (title.Trim().Length > 200)
        {
            errors["title"] = ["Title cannot exceed 200 characters."];
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            errors["description"] = ["A description is required."];
        }
        else if (description.Trim().Length > 4000)
        {
            errors["description"] = ["Description cannot exceed 4000 characters."];
        }

        if (!Enum.IsDefined(priority))
        {
            errors["priority"] = ["A valid priority is required."];
        }

        return errors;
    }

    private static Dictionary<string, string[]> ValidateScheduleInput(
        DateTime scheduledStartUtc,
        DateTime scheduledEndUtc
    )
    {
        var errors = new Dictionary<string, string[]>();

        if (scheduledStartUtc.Kind != DateTimeKind.Utc)
        {
            errors["scheduledStartUtc"] = ["Scheduled start time must be supplied in UTC."];
        }

        if (scheduledEndUtc.Kind != DateTimeKind.Utc)
        {
            errors["scheduledEndUtc"] = ["Scheduled end time must be supplied in UTC."];
        }

        if (errors.Count == 0 && scheduledStartUtc >= scheduledEndUtc)
        {
            errors["scheduledEndUtc"] = ["Scheduled end time must be later than scheduled start time."];
        }
        
        return errors;
    }
}