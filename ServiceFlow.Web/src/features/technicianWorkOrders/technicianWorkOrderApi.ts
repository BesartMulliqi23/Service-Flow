import { apiRequest } from "../../api/apiClient";
import type { WorkOrderPriority } from "../calendar/calendarApi";
import type { WorkOrderStatus } from "../workOrders/workOrderApi";

export interface TechnicianWorkOrder {
    id: string,
    title: string,
    description: string,
    priority: WorkOrderPriority,
    status: WorkOrderStatus,
    customerName: string,
    serviceLocationId: string,
    serviceLocationName: string,
    addressLine1: string,
    addressLine2: string | null,
    city: string,
    postalCode: string | null,
    country: string,
    accessInstructions: string | null,
    dueUtc: string | null,
    scheduledStartUtc: string | null,
    scheduledEndUtc: string | null,
    startedUtc: string | null,
    completedUtc: string | null
}

export function getTechnicianWorkOrders(status?: WorkOrderStatus) {
    const query = new URLSearchParams();

    if (status) {
        query.set('status', status);
    }

    const suffix = query.size > 0 ? `?${query.toString()}` : '';

    return apiRequest<TechnicianWorkOrder[]>(`/technician/work-order${suffix}`);
}