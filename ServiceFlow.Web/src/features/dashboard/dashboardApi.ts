import { apiRequest } from "../../api/apiClient";

export type DashboardUpcomingWorkOrder  = {
    id: string,
    title: string,
    priority: 'Low' | 'Normal' | 'High' | 'Urgent',
    scheduledStartUtc: string,
    scheduledEndtUtc: string,
    customerName: string,
    serviceLocationName: string,
    technicianNames: string[]
};

export type DashboardSummary = {
    draftWorkOrderCount: number,
    scheduledWorkOrderCount: number,
    inProgressWorkOrderCount: number,
    completedWorkOrderCount: number,
    cancelledWorkOrderCount: number,
    completedWorkOrdersLast30Days: number,
    materialCostRecordedLast30Days: number,
    upcomingWorkOrders: DashboardUpcomingWorkOrder[]
};

export function getDashboardSummary() {
    return apiRequest<DashboardSummary>('/dashboard/summary');
}