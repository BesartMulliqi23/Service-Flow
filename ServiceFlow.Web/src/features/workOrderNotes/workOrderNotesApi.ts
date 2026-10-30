import { apiRequest } from "../../api/apiClient";

export type WorkOrderNote = {
    id: string,
    content: string,
    createdByDisplayName: string,
    createdUtc: string
};

export function getTechnicianWorkOrderNotes(workOrderId: string) {
    return apiRequest<WorkOrderNote[]>(`/technician/work-orders/${workOrderId}/notes`);
}

export function createTechnicianWorkOrderNote(workOrderId: string, content: string) {
    return apiRequest<WorkOrderNote>(`/technician/work-orders/${workOrderId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content })
    });
}

export function getWorkOrderNotes(workOrderId: string) {
    return apiRequest<WorkOrderNote[]>(`/work-orders/${workOrderId}/notes`);
}