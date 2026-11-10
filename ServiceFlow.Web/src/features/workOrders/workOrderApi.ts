import { apiRequest } from "../../api/apiClient";
import type { PagedResponse } from "../../api/pagination";

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
    search?: string,
    serviceLocationId?: string,
    status?: WorkOrderStatus,
    priority?: WorkOrderPriority,
    page: number,
    pageSize: number
}

export function getWorkOrders({
    search,
    serviceLocationId,
    status,
    priority,
    page,
    pageSize
}: GetWorkOrdersParams) {
    const query = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize)
    });

    if (search?.trim()) {
        query.set('search', search.trim());
    }

    if (serviceLocationId) {
        query.set('serviceLocationId', serviceLocationId);
    }

    if (status) {
        query.set('status', status);
    }

    if (priority) {
        query.set('priority', priority);
    }

    return apiRequest<PagedResponse<WorkOrder>>(`/work-orders?${query.toString()}`);
}

export function createWorkOrder(input: WorkOrderInput) {
    return apiRequest<WorkOrder>('/work-orders', {
        method: 'POST',
        body: JSON.stringify(input)
    });
}

export function updateWorkOrder(workOrderId: string, input: WorkOrderInput) {
    return apiRequest<WorkOrder>(`/work-orders/${workOrderId}`, {
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
    return apiRequest<WorkOrder>(`/work-orders/${workOrderId}/schedule`, {
        method: 'POST',
        body: JSON.stringify(input)
    });
}

export interface WorkOrderAssignment {
    technicianId: string,
    displayName: string,
    email: string,
    assignedUtc: string
}

export function getWorkOrderAssignments(workOrderId: string) {
    return apiRequest<WorkOrderAssignment[]>(`/work-orders/${workOrderId}/assignments`);
}

export function assignTechnician(workOrderId: string, technicianId: string) {
    return apiRequest<WorkOrderAssignment>(`/work-orders/${workOrderId}/assignments`, {
        method: 'POST',
        body: JSON.stringify({ technicianId })
    });
}

export function removeTechnicianAssignment(workOrderId: string, technicianId: string) {
    return apiRequest<void>(`/work-orders/${workOrderId}/assignments/${technicianId}`, {
        method: 'DELETE'
    });
}