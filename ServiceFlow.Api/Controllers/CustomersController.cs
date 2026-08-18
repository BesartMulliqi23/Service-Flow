using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.Customers;
using ServiceFlow.Api.Services.Customers;

namespace ServiceFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = OrganizationPolicies.ManageCustomers)]
public sealed class CustomersController(
    ICustomerService customerService
) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType(typeof(CustomerResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CustomerResponse>> Create(CreateCustomerRequest request, CancellationToken cancellationToken)
    {
        var errors = ValidateCustomerInput(
            request.Name,
            request.ContactName,
            request.Email,
            request.PhoneNumber,
            request.Notes
        );

        if (errors.Count > 0)
        {
            return ValidationProblem(new ValidationProblemDetails(errors));
        }

        var customer = await customerService.CreateAsync(request, cancellationToken);

        return CreatedAtAction(nameof(GetById), new { customerId = customer.Id }, customer);
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<CustomerResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CustomerResponse>>> GetAll(
        [FromQuery] bool includeInactive,
        CancellationToken cancellationToken
    )
    {
        var customers = await customerService.GetAllAsync(includeInactive, cancellationToken);

        return Ok(customers);
    }

    [HttpGet("{customerId:guid}")]
    [ProducesResponseType(typeof(CustomerResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CustomerResponse>> GetById(Guid customerId, CancellationToken cancellationToken)
    {
        var customer = await customerService.GetByIdAsync(customerId, cancellationToken);

        return customer is null ? NotFound() : Ok(customer);
    }

    [HttpPut("{customerId:guid}")]
    [ProducesResponseType(typeof(CustomerResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CustomerResponse>> Update(
        Guid customerId, 
        UpdateCustomerRequest request, 
        CancellationToken cancellationToken
    )
    {
        var errors = ValidateCustomerInput(
            request.Name,
            request.ContactName,
            request.Email,
            request.PhoneNumber,
            request.Notes
        );

        if (errors.Count > 0)
        {
            return ValidationProblem(new ValidationProblemDetails(errors));
        }

        var customer = await customerService.UpdateAsync(customerId, request, cancellationToken);

        return customer is null ? NotFound() : Ok(customer);
    }

    [HttpPost("{customerId:guid}/deactivate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deactivate(Guid customerId, CancellationToken cancellationToken)
    {
        var succeeded = await customerService.DeactivateAsync(customerId, cancellationToken);

        return succeeded ? NoContent() : NotFound();
    }

    private static Dictionary<string, string[]> ValidateCustomerInput(
        string? name,
        string? contactName,
        string? email,
        string? phoneNumber,
        string? notes
    )
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(name))
        {
            errors["name"] = ["A customer name is required."];
        }
        else if (name.Trim().Length > 200)
        {
            errors["name"] = ["Customer name cannot exceed 200 characters."];
        }

        if (!string.IsNullOrWhiteSpace(contactName) && contactName.Trim().Length > 200)
        {
            errors["contactName"] = ["Contact name cannot exceed 200 characters."];
        }

        if (!string.IsNullOrWhiteSpace(email) && !new EmailAddressAttribute().IsValid(email))
        {
            errors["email"] = ["A valid email address is required."];
        }

        if (!string.IsNullOrWhiteSpace(email) && email.Trim().Length > 256)
        {
            errors["email"] = ["Email cannot exceed 256 characters."];
        }

        if (!string.IsNullOrWhiteSpace(phoneNumber) && phoneNumber.Trim().Length > 50)
        {
            errors["phoneNumber"] = ["Phone number cannot exceed 50 characters."];
        }

        if (!string.IsNullOrWhiteSpace(notes) && notes.Trim().Length > 2000)
        {
            errors["notes"] = ["Notes cannot exceed 2000 characters."];
        }

        return errors;
    }
}