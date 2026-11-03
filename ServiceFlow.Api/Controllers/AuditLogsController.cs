using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.AuditLogs;
using ServiceFlow.Api.Models;
using ServiceFlow.Api.Services.AuditLogging;

namespace ServiceFlow.Api.Controllers;

[ApiController]
[Route("api/audit-logs")]
[Authorize(Policy = OrganizationPolicies.ViewAuditLogs)]
public sealed class AuditLogsController(
    IAuditLogService auditLogService
) : ControllerBase
{
    private const int DefaultPageSize = 25;
    private const int MaximumPageSize = 100;

    [HttpGet]
    [ProducesResponseType(typeof(PagedAuditLogsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PagedAuditLogsResponse>> GetAll(
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        [FromQuery] string? actorUserId,
        [FromQuery] AuditLogAction? action,
        [FromQuery] string? entityType,
        [FromQuery] DateTime? fromUtc,
        [FromQuery] DateTime? toUtc,
        CancellationToken cancellationToken
    )
    {
        var errors = ValidateDateRange(fromUtc, toUtc);

        if (errors.Count > 0)
        {
            return ValidationProblem(new ValidationProblemDetails(errors));
        }

        var normalizedPage = Math.Max(page ?? 1, 1);
        var normalizedPageSize = Math.Clamp(
            pageSize ?? DefaultPageSize,
            1,
            MaximumPageSize
        );

        var response = await auditLogService.GetForCurrentOrganizationAsync(
            normalizedPage,
            normalizedPageSize,
            actorUserId,
            action,
            entityType,
            fromUtc,
            toUtc,
            cancellationToken
        );

        return Ok(response);
    }

    private static Dictionary<string, string[]> ValidateDateRange(
        DateTime? fromUtc,
        DateTime? toUtc
    )
    {
        var errors = new Dictionary<string, string[]>();

        if (fromUtc.HasValue && fromUtc.Value.Kind != DateTimeKind.Utc)
        {
            errors["fromUtc"] = ["The start date must be supplied in UTC."];
        }

        if (toUtc.HasValue && toUtc.Value.Kind != DateTimeKind.Utc)
        {
            errors["toUtc"] = ["The end date must be supplied in UTC."];
        }

        if (
            errors.Count == 0 &&
            fromUtc.HasValue &&
            toUtc.HasValue &&
            fromUtc.Value > toUtc.Value
        )
        {
            errors["toUtc"] = ["The end date must be later than or equal to the start date."];
        }

        return errors;
    }
}