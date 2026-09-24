using ServiceFlow.Api.Contracts.Calendar;

namespace ServiceFlow.Api.Services.Calendar;

public interface ICalendarService
{
    Task<IReadOnlyList<CalendarWorkOrderResponse>> GetWorkOrderAsync(
        DateTime fromUtc,
        DateTime toUtc,
        string? technicianId,
        CancellationToken cancellationToken
    );
}