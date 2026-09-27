using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.Materials;
using ServiceFlow.Api.Services.Materials;

namespace ServiceFlow.Api.Controllers;

[ApiController]
[Route("api/work-orders/{workOrderId:guid}/materials")]
[Authorize(Policy = OrganizationPolicies.ManageWorkOrderMaterials)]
public sealed class WorkOrderMaterialsController(
    IWorkOrderMaterialService workOrderMaterialService
) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<WorkOrderMaterialResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<WorkOrderMaterialResponse>>> GetAll(
        Guid workOrderId,
        CancellationToken cancellationToken
    )
    {
        var result = await workOrderMaterialService.GetAllAsync(workOrderId, cancellationToken);

        return result.Status == WorkOrderMaterialOperationStatus.WorkOrderNotFound
            ? NotFound()
            : Ok(result.Materials);
    }

    [HttpPost]
    [ProducesResponseType(typeof(WorkOrderMaterialResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<WorkOrderMaterialResponse>> Create(
        Guid workOrderId,
        AddWorkOrderMaterialRequest request,
        CancellationToken cancellationToken
    )
    {
        var errors = ValidateAddInput(
            request.MaterialId,
            request.Quantity,
            request.UnitCost
        );

        if (errors.Count > 0)
        {
            return ValidationProblem(new ValidationProblemDetails(errors));
        }

        var result = await workOrderMaterialService.AddAsync(workOrderId, request, cancellationToken);

        if (result.Status == WorkOrderMaterialOperationStatus.Success)
        {
            return CreatedAtAction(
                nameof(GetAll),
                new { workOrderId },
                result.MaterialUsage
            );
        }

        if (result.Status == WorkOrderMaterialOperationStatus.MaterialNotFound ||
            result.Status == WorkOrderMaterialOperationStatus.WorkOrderNotFound)
        {
            return NotFound();
        }

        if (result.Status == WorkOrderMaterialOperationStatus.MaterialInactive)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Material is inactive.",
                Detail = "Only active catalog materials can be added to a Work Order.",
                Status = StatusCodes.Status409Conflict
            });
        }

        if (result.Status == WorkOrderMaterialOperationStatus.DuplicateMaterialLine)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Material is already recorded on this Work Order.",
                Detail = "Update the existing material line instead of adding a duplicate.",
                Status = StatusCodes.Status409Conflict
            });
        }

        if (result.Status == WorkOrderMaterialOperationStatus.WorkOrderNotInProgress)
        {
            return Conflict(CreateTechnicianWorkOrderStateProblem());
        }

        throw new InvalidOperationException($"Unexpected result status: {result.Status}");
    }

    [HttpPut("{workOrderMaterialId:guid}")]
    [ProducesResponseType(typeof(WorkOrderMaterialResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<WorkOrderMaterialResponse>> Update(
        Guid workOrderId,
        Guid workOrderMaterialId,
        UpdateWorkOrderMaterialRequest request,
        CancellationToken cancellationToken
    )
    {
        var errors = ValidateUpdateInput(request.Quantity, request.UnitCost);

        if (errors.Count > 0)
        {
            return ValidationProblem(new ValidationProblemDetails(errors));
        }

        var result = await workOrderMaterialService.UpdateAsync(
            workOrderId,
            workOrderMaterialId,
            request,
            cancellationToken
        );

        if (result.Status == WorkOrderMaterialOperationStatus.Success)
        {
            return Ok(result.MaterialUsage);
        }

        if (result.Status == WorkOrderMaterialOperationStatus.WorkOrderNotFound ||
            result.Status == WorkOrderMaterialOperationStatus.UsageLineNotFound)
        {
            return NotFound();
        }

        if (result.Status == WorkOrderMaterialOperationStatus.WorkOrderNotInProgress)
        {
            return Conflict(CreateTechnicianWorkOrderStateProblem());
        }

        throw new InvalidOperationException($"Unexpected result status: {result.Status}");
    }

    [HttpDelete("{workOrderMaterialId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Remove(
        Guid workOrderId,
        Guid workOrderMaterialId,
        CancellationToken cancellationToken
    )
    {
        var status = await workOrderMaterialService.RemoveAsync(workOrderId, workOrderMaterialId, cancellationToken);

        if (status == WorkOrderMaterialOperationStatus.Success)
        {
            return NoContent();
        }

        if (status == WorkOrderMaterialOperationStatus.WorkOrderNotFound ||
            status == WorkOrderMaterialOperationStatus.UsageLineNotFound)
        {
            return NotFound();
        }

        if (status == WorkOrderMaterialOperationStatus.WorkOrderNotInProgress)
        {
            return Conflict(CreateTechnicianWorkOrderStateProblem());
        }

        throw new InvalidOperationException($"Unexpected result status: {status}");
    }

    private static Dictionary<string, string[]> ValidateAddInput(
        Guid materialId, 
        decimal? quantity, 
        decimal? unitCost
    )
    {
        var errors = ValidateQuantityAndCost(quantity, unitCost);

        if (materialId == Guid.Empty)
        {
            errors["materialId"] = ["A material ID is required"];
        }

        return errors;
    }

    private static Dictionary<string, string[]> ValidateUpdateInput(
        decimal? quantity, 
        decimal? unitCost
    )
    {
        return ValidateQuantityAndCost(quantity, unitCost);
    }

    private static Dictionary<string, string[]> ValidateQuantityAndCost(
        decimal? quantity, 
        decimal? unitCost
    )
    {
        var errors = new Dictionary<string, string[]>();

        if (!quantity.HasValue)
        {
            errors["quantity"] = ["A quantity is required."];
        }
        else if (quantity.Value < 0)
        {
            errors["quantity"] = ["Quantity must be greater than zero."];
        }

        if (unitCost.HasValue && unitCost.Value < 0)
        {
            errors["unitCost"] = ["Unit cost cannot be negative."];
        }

        return errors;
    }

    private static ProblemDetails CreateTechnicianWorkOrderStateProblem()
    {
        return new ProblemDetails
        {
            Title = "Materials cannot be changed on this Work Order.",
            Detail = "Technicians can record materials only while an assigned Work Order is In Progress.",
            Status = StatusCodes.Status409Conflict
        };
    }
} 