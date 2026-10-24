using Microsoft.EntityFrameworkCore;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.Dashboard;
using ServiceFlow.Api.Data;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.Dashboard;

public sealed class DashboardService(
    ApplicationDbContext dbContext,
    ICurrentOrganization currentOrganization
) : IDashboardService
{
    public async Task<DashboardSummaryResponse> GetSummaryAsync(CancellationToken cancellationToken)
    {
        var organizationId = currentOrganization.OrganizationId;

        var now = DateTime.UtcNow;
        var recentActivityStart = now.AddDays(-30);
        var upcomingWindowEnd = now.AddDays(7);

        var statusCounts = await dbContext.WorkOrders
            .AsNoTracking()
            .Where(workOrder => workOrder.OrganizationId == organizationId)
            .GroupBy(workOrder => workOrder.Status)
            .Select(group => new
            {
                Status = group.Key,
                Count = group.Count()
            })
            .ToListAsync(cancellationToken);

        var statusCountByStatus = statusCounts.ToDictionary(
            item => item.Status,
            item => item.Count
        );

        var completedWorkOrdersLast30Days = await dbContext.WorkOrders
            .AsNoTracking()
            .CountAsync(
                workOrder =>
                    workOrder.OrganizationId == organizationId &&
                    workOrder.Status == WorkOrderStatus.Completed &&
                    workOrder.CompletedUtc.HasValue &&
                    workOrder.CompletedUtc.Value >= recentActivityStart,
                cancellationToken
            );

        var materialCostRecordedLast30Days = await dbContext.WorkOrderMaterials
            .AsNoTracking()
            .Where(
                material =>
                    material.OrganizationId == organizationId &&
                    material.AddedUtc >= recentActivityStart
            )
            .Select(material => (decimal?)(material.Quantity * material.UnitCost))
            .SumAsync(cancellationToken) ?? 0m;

        var upcomingWorkOrders = await dbContext.WorkOrders
            .AsNoTracking()
            .Where(
                workOrder =>
                    workOrder.OrganizationId == organizationId &&
                    workOrder.Status == WorkOrderStatus.Scheduled &&
                    workOrder.ScheduledStartUtc.HasValue &&
                    workOrder.ScheduledEndUtc.HasValue &&
                    workOrder.ScheduledStartUtc.Value >= now &&
                    workOrder.ScheduledStartUtc.Value <= upcomingWindowEnd
            )
            .OrderBy(workOrder => workOrder.ScheduledStartUtc)
            .ThenBy(workOrder => workOrder.Title)
            .Take(5)
            .Select(workOrder => new DashboardUpcomingWorkOrderResponse(
                workOrder.Id,
                workOrder.Title,
                workOrder.Priority,
                workOrder.ScheduledStartUtc!.Value,
                workOrder.ScheduledEndUtc!.Value,
                workOrder.ServiceLocation.Customer.Name,
                workOrder.ServiceLocation.Name,
                workOrder.Assignments
                    .Where(assignment => assignment.OrganizationId == organizationId)
                    .OrderBy(assignment => assignment.AssignedUtc)
                    .Select(assignment => assignment.Technician.DisplayName)
                    .ToList()
            ))
            .ToListAsync(cancellationToken);

        return new DashboardSummaryResponse(
            GetStatusCount(statusCountByStatus, WorkOrderStatus.Draft),
            GetStatusCount(statusCountByStatus, WorkOrderStatus.Scheduled),
            GetStatusCount(statusCountByStatus, WorkOrderStatus.InProgress),
            GetStatusCount(statusCountByStatus, WorkOrderStatus.Completed),
            GetStatusCount(statusCountByStatus, WorkOrderStatus.Cancelled),
            completedWorkOrdersLast30Days,
            materialCostRecordedLast30Days,
            upcomingWorkOrders
        );
    }

    private static int GetStatusCount(
        IReadOnlyDictionary<WorkOrderStatus, int> statusCounts,
        WorkOrderStatus status
    )
    {
        return statusCounts.TryGetValue(status, out var count) ? count : 0;
    }
}