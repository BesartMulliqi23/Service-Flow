using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.Materials;
using ServiceFlow.Api.Services.Materials;

namespace ServiceFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = OrganizationPolicies.ManageWorkOrders)]
public sealed class MaterialsController(
    IMaterialCatalogService materialCatalogService
) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType(typeof(MaterialResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<MaterialResponse>> Create(
        CreateMaterialRequest request,
        CancellationToken cancellationToken
    )
    {
        var errors = ValidateMaterialInput(
            request.Name,
            request.Sku,
            request.UnitOfMeasure,
            request.DefaultUnitCost
        );

        if (errors.Count > 0)
        {
            return ValidationProblem(new ValidationProblemDetails(errors));
        }

        var result = await materialCatalogService.CreateAsync(request, cancellationToken);

        if (result.Status == MaterialCatalogMutationStatus.DuplicateSku)
        {
            return Conflict(CreateDuplicateSkuProblem());
        }

        return CreatedAtAction(nameof(GetById), new { materialId = result.Material!.Id }, result.Material);
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<MaterialResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<MaterialResponse>>> GetAll(
        [FromQuery] bool includeInactive,
        CancellationToken cancellationToken
    )
    {
        var materials = await materialCatalogService.GetAllAsync(includeInactive, cancellationToken);

        return Ok(materials);
    }

    [HttpGet("{materialId:guid}")]
    [ProducesResponseType(typeof(MaterialResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MaterialResponse>> GetById(
        Guid materialId,
        CancellationToken cancellationToken
    )
    {
        var material = await materialCatalogService.GetByIdAsync(materialId, cancellationToken);

        return material is null ? NotFound() : Ok(material);
    }

    [HttpPut("{materialId:guid}")]
    [ProducesResponseType(typeof(MaterialResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<MaterialResponse>> Update(
        Guid materialId,
        UpdateMaterialRequest request,
        CancellationToken cancellationToken
    )
    {
        var errors = ValidateMaterialInput(
            request.Name,
            request.Sku,
            request.UnitOfMeasure,
            request.DefaultUnitCost
        );

        if (errors.Count > 0)
        {
            return ValidationProblem(new ValidationProblemDetails(errors));
        }

        var result = await materialCatalogService.UpdateAsync(materialId, request, cancellationToken);

        if (result.Status == MaterialCatalogMutationStatus.NotFound)
        {
            return NotFound();
        }

        if (result.Status == MaterialCatalogMutationStatus.DuplicateSku)
        {
            return Conflict(CreateDuplicateSkuProblem());
        }

        return Ok(result.Material);
    }

    [HttpPost("{materialId:guid}/deactivate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deactivate(
        Guid materialId,
        CancellationToken cancellationToken
    )
    {
        var status = await materialCatalogService.DeactiveAsync(materialId, cancellationToken);

        return status == MaterialCatalogMutationStatus.NotFound
            ? NotFound()
            : NoContent();
    }

    private static Dictionary<string, string[]> ValidateMaterialInput(
        string? name,
        string? sku,
        string? unitOfMeasure,
        decimal? defaultUnitCost
    )
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(name))
        {
            errors["name"] = ["A material name is required."];
        }
        else if (name.Trim().Length > 200)
        {
            errors["name"] = ["Material name cannot exceed 200 characters."];
        }

        if (!string.IsNullOrWhiteSpace(sku) && sku.Trim().Length > 100)
        {
            errors["sku"] = ["SKU cannot exceed 100 characters."];
        }

        if (string.IsNullOrWhiteSpace(unitOfMeasure))
        {
            errors["unitOfMeasure"] = ["A unit of measure is required."];
        }
        else if (unitOfMeasure.Trim().Length > 30)
        {
            errors["unitOfMeasure"] = ["Unit of measure cannot exceed 200 characters."];
        }

        if (!defaultUnitCost.HasValue)
        {
            errors["defaultUnitCost"] = ["A default unit cost is required."];
        }
        else if (defaultUnitCost.Value < 0)
        {
            errors["defaultUnitCost"] = ["Default unit cost cannot be negative."];
        }

        return errors;
    }

    private static ProblemDetails CreateDuplicateSkuProblem()
    {
        return new ProblemDetails{
            Title = "An active material already uses this SKU.",
            Detail = "SKUs must be unique among active materials in the organization.",
            Status = StatusCodes.Status409Conflict
        };
    }
}