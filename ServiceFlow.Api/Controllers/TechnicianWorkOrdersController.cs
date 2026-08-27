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
}