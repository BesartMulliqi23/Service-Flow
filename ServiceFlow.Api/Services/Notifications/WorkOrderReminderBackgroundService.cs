
namespace ServiceFlow.Api.Services.Notifications;

public sealed class WorkOrderReminderBackgroundService(
    IServiceScopeFactory serviceScopeFactory,
    ILogger<WorkOrderReminderBackgroundService> logger
) : BackgroundService
{
    private static readonly TimeSpan ProcessingInterval = TimeSpan.FromMinutes(5);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await ProcessRemindersAsync(stoppingToken);

        using var timer = new PeriodicTimer(ProcessingInterval);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            await ProcessRemindersAsync(stoppingToken);
        }
    }

    private async Task ProcessRemindersAsync(CancellationToken stoppingToken)
    {
        try
        {
            using var scope = serviceScopeFactory.CreateScope();

            var processor = scope.ServiceProvider.GetRequiredService<IWorkOrderReminderProcessor>();

            var createdReminderCount = await processor.ProcessAsync(stoppingToken);

            if (createdReminderCount > 0)
            {
                logger.LogInformation(
                    "Created {CreatedReminderCount} upcoming Work Order reminder notifications.", 
                    createdReminderCount
                );
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // Graceful application shutdown.
        }
        catch (Exception e)
        {
            logger.LogError(
                e,
                "An error occurred while processing upcoming Work Order reminders."
            );
        }
    }
}