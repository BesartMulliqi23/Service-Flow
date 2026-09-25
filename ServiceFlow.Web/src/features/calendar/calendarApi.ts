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
    toUtc: Date,
    technicianId?: string
}

export function getCalendarWorkOrders({ fromUtc, toUtc, technicianId }: GetCalendarWorkOrdersParams) {
    const query = new URLSearchParams({
        fromUtc: fromUtc.toISOString(),
        toUtc: toUtc.toISOString()
    });

    if (technicianId) {
        query.set('technicianId', technicianId);
    }

    return apiRequest<CalendarWorkOrder[]>(`/calendar/work-orders?${query.toString()}`);
}