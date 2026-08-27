using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.Technicians;
using ServiceFlow.Api.Services.Technicians;

namespace ServiceFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = OrganizationPolicies.ManageWorkOrders)]
public sealed class TechniciansController(
    ITechnicianDirectoryService technicianDirectoryService
) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<TechnicianResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<TechnicianResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var technicians = await technicianDirectoryService.GetAllAsync(cancellationToken);

        return Ok(technicians);
    }
}