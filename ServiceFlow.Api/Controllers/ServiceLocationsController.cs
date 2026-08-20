using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.ServiceLocations;
using ServiceFlow.Api.Services.ServiceLocations;

namespace ServiceFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = OrganizationPolicies.ManageCustomers)]
public sealed class ServiceLocationsController(
    IServiceLocationService serviceLocationService
) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType(typeof(ServiceLocationResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ServiceLocationResponse>> Create(
        CreateServiceLocationRequest request,
        CancellationToken cancellationToken
    )
    {
        var errors = ValidateLocationInput(
            request.Name,
            request.AddressLine1,
            request.AddressLine2,
            request.City,
            request.PostalCode,
            request.Country,
            request.AccessInstructions
        );

        if (request.CustomerId == Guid.Empty)
        {
            errors["customerId"] = ["A customer ID is required."];
        }

        if (errors.Count > 0)
        {
            return ValidationProblem(new ValidationProblemDetails(errors));
        }

        var result = await serviceLocationService.CreateAsync(request, cancellationToken);

        if (result.Status == CreateServiceLocationStatus.Success)
        {
            return CreatedAtAction(
                nameof(GetById), 
                new { serviceLocationId = result.ServiceLocation!.Id },
                result.ServiceLocation
            );
        }

        if (result.Status == CreateServiceLocationStatus.CustomerNotFound)
        {
            return NotFound();
        }

        if (result.Status == CreateServiceLocationStatus.CustomerInactive)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Customer is inactive.",
                Detail = "A new service location cannot be added to an inactive customer.",
                Status = StatusCodes.Status409Conflict
            });
        }

        throw new InvalidOperationException($"Unexpected result status: {result.Status}");
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ServiceLocationResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ServiceLocationResponse>>> GetAll(
        [FromQuery] Guid? customerId,
        [FromQuery] bool includeInactive,
        CancellationToken cancellationToken
    )
    {
        var locations = await serviceLocationService.GetAllAsync(customerId, includeInactive, cancellationToken);

        return Ok(locations);
    }

    [HttpGet("{serviceLocationId:guid}")]
    [ProducesResponseType(typeof(ServiceLocationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ServiceLocationResponse>> GetById(Guid serviceLocationId, CancellationToken cancellationToken)
    {
        var location = await serviceLocationService.GetByIdAsync(serviceLocationId, cancellationToken);

        return location is null ? NotFound() : Ok(location);
    }

    [HttpPut("{serviceLocationId:guid}")]
    [ProducesResponseType(typeof(ServiceLocationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ServiceLocationResponse>> Update(
        Guid serviceLocationId,
        UpdateServiceLocationRequest request,
        CancellationToken cancellationToken
    )
    {
        var errors = ValidateLocationInput(
            request.Name,
            request.AddressLine1,
            request.AddressLine2,
            request.City,
            request.PostalCode,
            request.Country,
            request.AccessInstructions
        );

        if (errors.Count > 0)
        {
            return ValidationProblem(new ValidationProblemDetails(errors));
        }

        var location = await serviceLocationService.UpdateAsync(serviceLocationId, request, cancellationToken);

        return location is null ? NotFound() : Ok(location);
    }

    [HttpPost("{serviceLocationId:guid}/deactivate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deactivate(Guid serviceLocationId, CancellationToken cancellationToken)
    {
        var succeeded = await serviceLocationService.DeactivateAsync(serviceLocationId, cancellationToken);

        return succeeded ? NoContent() : NotFound();
    }

    private static Dictionary<string, string[]> ValidateLocationInput(
        string? name,
        string? addressLine1,
        string? addressLine2,
        string? city,
        string? postalCode,
        string? country,
        string? accessInstructions
    )
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(name))
        {
            errors["name"] = ["Name is required."];
        }
        else if (name.Trim().Length > 200)
        {
            errors["name"] = ["Name cannot exceed 200 characters."];
        }

        if (string.IsNullOrWhiteSpace(addressLine1))
        {
            errors["addressLine1"] = ["Address line 1 is required."];
        }
        else if (addressLine1.Trim().Length > 200)
        {
            errors["addressLine1"] = ["Address line 1 cannot exceed 200 characters."];
        }

        if (!string.IsNullOrWhiteSpace(addressLine2) && addressLine2.Trim().Length > 200)
        {
            errors["addressLine2"] = ["Address line 2 cannot exceed 200 characters."];
        }

        if (string.IsNullOrWhiteSpace(city))
        {
            errors["city"] = ["City is required."];
        }
        else if (city.Trim().Length > 100)
        {
            errors["city"] = ["City cannot exceed 100 characters."];
        }

        if (!string.IsNullOrWhiteSpace(postalCode) && postalCode.Trim().Length > 20)
        {
            errors["postalCode"] = ["Postal code cannot exceed 20 characters."];
        }

        if (string.IsNullOrWhiteSpace(country))
        {
            errors["country"] = ["Country is required."];
        }
        else if (country.Trim().Length > 100)
        {
            errors["country"] = ["Country cannot exceed 100 characters."];
        }

        if (!string.IsNullOrWhiteSpace(accessInstructions) && accessInstructions.Trim().Length > 1000)
        {
            errors["accessInstructions"] = ["Access instructions cannot exceed 1000 characters."];
        }

        return errors;
    }
}