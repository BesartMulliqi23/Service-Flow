using ServiceFlow.Api.Contracts.Dashboard;

namespace ServiceFlow.Api.Services.Dashboard;

public interface IDashboardService
{
    Task<DashboardSummaryResponse> GetSummaryAsync(CancellationToken cancellationToken);
}