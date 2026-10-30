import { apiRequest, apiUrl } from "../../api/apiClient"

export interface WorkOrderAttachment {
    id: string,
    originalFileName: string,
    contentType: string,
    fileSizeBytes: number,
    uploadedByDisplayName: string,
    createdUtc: string
}

export function getTechnicianWorkOrderAttachments(workOrderId: string) {
    return apiRequest<WorkOrderAttachment[]>(`/technician/work-orders/${workOrderId}/attachments`);
}

export function uploadTechnicianWorkOrderAttachment(workOrderId: string, file: File) {
    const formData = new FormData();

    formData.append('file', file);

    return apiRequest<WorkOrderAttachment>(`/technician/work-orders/${workOrderId}/attachments`, {
        method: 'POST',
        body: formData
    });   
}

export function getTechnicianAttachmentDownloadUrl(workOrderId: string, attachmentId: string) {
    return apiUrl(`/technician/work-orders/${workOrderId}/attachments/${attachmentId}/download`);
}

export function getWorkOrderAttachments(workOrderId: string) {
    return apiRequest<WorkOrderAttachment[]>(`/work-orders/${workOrderId}/attachments`);
}

export function getWorkOrderAttachmentDownloadUrl(workOrderId: string, attachmentId: string) {
    return apiUrl(`/work-orders/${workOrderId}/attachments/${attachmentId}/download`);
}