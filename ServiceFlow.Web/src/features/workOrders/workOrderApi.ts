import { apiRequest } from "../../api/apiClient";

export type WorkOrderPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export type WorkOrderStatus = 'Draft' | 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled';

export interface WorkOrder {
    id: string,
    serviceLocationId: string,
    serviceLocationName: string,
    customerId: string,
    customerName: string,
    title: string,
    description: string,
    priority: WorkOrderPriority,
    status: WorkOrderStatus,
    dueUtc: string | null,
    scheduledStartUtc: string | null,
    scheduledEndUtc: string | null,
    startedUtc: string | null,
    completedUtc: string | null,
    createdUtc: string,
    updatedUtc: string | null
}

export interface WorkOrderInput {
    serviceLocationId: string,
    title: string,
    description: string,
    priority: WorkOrderPriority,
    dueUtc: string | null
}

export interface ScheduleWorkOrderInput {
    scheduledStartUtc: string,
    scheduledEndUtc: string
}

interface GetWorkOrdersParams {
    serviceLocationId?: string,
    status?: WorkOrderStatus
}

export function getWorkOrders({
    serviceLocationId,
    status
}: GetWorkOrdersParams) {
    const query = new URLSearchParams();

    if (serviceLocationId) {
        query.set('serviceLocationId', serviceLocationId);
    }

    if (status) {
        query.set('status', status);
    }

    const suffix = query.size > 0 ? `?${query.toString()}` : '';

    return apiRequest<WorkOrder[]>(`/workorders${suffix}`);
}

export function createWorkOrder(input: WorkOrderInput) {
    return apiRequest<WorkOrder>('/workorders', {
        method: 'POST',
        body: JSON.stringify(input)
    });
}

export function updateWorkOrder(workOrderId: string, input: WorkOrderInput) {
    return apiRequest<WorkOrder>(`/workorders/${workOrderId}`, {
        method: 'PUT',
        body: JSON.stringify({
            title: input.title,
            description: input.description,
            priority: input.priority,
            dueUtc: input.dueUtc
        })
    });
}

export function scheduleWorkOrder(workOrderId: string, input: ScheduleWorkOrderInput) {
    return apiRequest<WorkOrder>(`/workorders/${workOrderId}/schedule`, {
        method: 'POST',
        body: JSON.stringify(input)
    });
}