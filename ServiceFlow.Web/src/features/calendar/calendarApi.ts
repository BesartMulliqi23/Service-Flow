import { apiRequest } from "../../api/apiClient";

export type WorkOrderPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export type CalendarWorkOrderStatus = 'Scheduled' | 'InProgress';

export interface CalendarTechnician {
    id: string,
    displayName: string
}

export interface CalendarWorkOrder {
    id: string,
    title: string,
    priority: WorkOrderPriority,
    status: CalendarWorkOrderStatus,
    scheduledStartUtc: string,
    scheduledEndUtc: string,
    startedUtc: string | null,
    customerId: string,
    customerName: string,
    serviceLocationId: string,
    serviceLocationName: string,
    technicians: CalendarTechnician[]
}

interface GetCalendarWorkOrdersParams {
    fromUtc: Date,
    toUtc: Date
}

export function getCalendarWorkOrders({ fromUtc, toUtc }: GetCalendarWorkOrdersParams) {
    const query = new URLSearchParams({
        fromUtc: fromUtc.toISOString(),
        toUtc: toUtc.toISOString()
    });

    return apiRequest<CalendarWorkOrder[]>(`/calendar/work-orders?${query.toString()}`);
}