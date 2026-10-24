using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.Dashboard;
using ServiceFlow.Api.Services.Dashboard;

namespace ServiceFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = OrganizationPolicies.ViewReports)]
public sealed class DashboardController(
    IDashboardService dashboardService
) : ControllerBase
{
    [HttpGet("summary")]
    [ProducesResponseType(typeof(DashboardSummaryResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardSummaryResponse>> GetSummary(CancellationToken cancellationToken)
    {
        var summary = await dashboardService.GetSummaryAsync(cancellationToken);

        return Ok(summary);  
    }
}