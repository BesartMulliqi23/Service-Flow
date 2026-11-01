namespace ServiceFlow.Api.Services.Notifications;

public interface IWorkOrderReminderProcessor
{
    Task<int> ProcessAsync(CancellationToken cancellationToken);
}