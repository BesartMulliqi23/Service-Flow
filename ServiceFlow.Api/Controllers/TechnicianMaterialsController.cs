using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.Materials;
using ServiceFlow.Api.Services.Materials;

namespace ServiceFlow.Api.Controllers;

[ApiController]
[Route("api/technician/materials")]
[Authorize(Policy = OrganizationPolicies.ExecuteAssignedWork)]
public sealed class TechnicianMaterialsController(
    IMaterialCatalogService materialCatalogService
) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<MaterialResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<MaterialResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var materials = await materialCatalogService.GetAllAsync(includeInactive:false, cancellationToken);

        return Ok(materials);
    }
}