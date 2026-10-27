import { apiRequest } from "../../api/apiClient";

export type WorkOrderNote = {
    id: string,
    content: string,
    createdByDisplayName: string,
    createdUtc: string
};

export function getTechnicianWorkOrderNotes(workOrderId: string) {
    return apiRequest<WorkOrderNote[]>(`/technician/work-order/${workOrderId}/notes`);
}

export function createTechnicianWorkOrderNote(workOrderId: string, content: string) {
    return apiRequest<WorkOrderNote>(`/technician/work-order/${workOrderId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content })
    });
}