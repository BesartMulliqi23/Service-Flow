using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.Calendar;
using ServiceFlow.Api.Services.Calendar;

namespace ServiceFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = OrganizationPolicies.ManageWorkOrders)]
public sealed class CalendarController(
    ICalendarService calendarService
) : ControllerBase
{
    [HttpGet("work-orders")]
    [ProducesResponseType(typeof(IReadOnlyList<CalendarWorkOrderResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IReadOnlyList<CalendarWorkOrderResponse>>> GetWorkOrders(
        [FromQuery] DateTime? fromUtc,
        [FromQuery] DateTime? toUtc,
        [FromQuery] string? technicianId,
        CancellationToken cancellationToken
    )
    {
        var errors = ValidateRange(fromUtc, toUtc);

        if (errors.Count > 0)
        {
            return ValidationProblem(new ValidationProblemDetails(errors));
        }

        var workOrders = await calendarService.GetWorkOrderAsync(
            fromUtc!.Value,
            toUtc!.Value,
            technicianId,
            cancellationToken
        );

        return Ok(workOrders);
    }

    private static Dictionary<string, string[]> ValidateRange(DateTime? fromUtc, DateTime? toUtc)
    {
        var errors = new Dictionary<string, string[]>();

        if (!fromUtc.HasValue)
        {
            errors["fromUtc"] = ["A start date is required"];
        }
        else if (fromUtc.Value.Kind != DateTimeKind.Utc)
        {
            errors["fromUtc"] = ["The start date must be supplied in UTC."];
        }

        if (!toUtc.HasValue)
        {
            errors["toUtc"] = ["An end date is required."];
        }
        else if (toUtc.Value.Kind != DateTimeKind.Utc)
        {
            errors["toUtc"] = ["The end date must be supplied in UTC."];
        }

        if (errors.Count > 0)
        {
            return errors;
        }

        if (fromUtc!.Value >= toUtc!.Value)
        {
            errors["toUtc"] = ["The end date must be later than the start date."];
        }
        else if (toUtc!.Value - fromUtc.Value > TimeSpan.FromDays(31))
        {
            errors["toUtc"] = ["The requested calendar range cannot exceed 31 days."];
        }

        return errors;
    }
}