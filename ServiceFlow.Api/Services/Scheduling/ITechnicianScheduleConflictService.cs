namespace ServiceFlow.Api.Services.Scheduling;

public interface ITechnicianScheduleConflictService
{
    Task<TechnicianScheduleConflict?> FindFirstAsync(
        string technicianId,
        Guid excludedWorkOrderId,
        DateTime scheduledStartUtc,
        DateTime scheduledEndUtc,
        CancellationToken cancellationToken
    );
}