import { apiRequest } from "../../api/apiClient";

export type AuditLogAction =
    'CustomerCreated' |
    'CustomerUpdated' |
    'CustomerDeactivated' |
    'ServiceLocationCreated' |
    'ServiceLocationUpdated' |
    'ServiceLocationDeactivated' |
    'WorkOrderCreated' |
    'WorkOrderUpdated' |
    'WorkOrderScheduled' |
    'WorkOrderRescheduled' |
    'TechnicianAssigned' |
    'TechnicianUnassigned' |
    'WorkOrderStarted' |
    'WorkOrderCompleted' |
    'MaterialRecorded' |
    'MaterialUpdated' |
    'MaterialRemoved' |
    'JobNoteAdded' |
    'AttachmentUpload';

export type AuditEntityType = 
    'Customer' |
    'ServiceLocation' |
    'WorkOrder' |
    'WorkOrderMaterial' |
    'WorkOrderNote' |
    'WorkOrderAttachment';

export type AuditLogEntry = {
    id: string,
    actorUserId: string,
    actorDisplayName: string,
    action: AuditLogAction,
    entityType: AuditEntityType,
    entityId: string,
    summary: string,
    createdUtc: string
};

export type PagedAuditLogs = {
    items: AuditLogEntry [],
    page: number,
    pageSize: number,
    totalCount: number,
    totalPages: number
};

export type AuditLogQuery = {
    page?: number,
    pageSize?: number,
    actorUserId?: number,
    action?: AuditLogAction,
    entityType?: AuditEntityType,
    fromUtc?: string,
    toUtc?: string
};

export function getAuditLogs(query: AuditLogQuery) {
    const searchParameters = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== '') {
            searchParameters.set(key, String(value));
        }
    }

    const suffix = searchParameters.size > 0
        ? `?${searchParameters.toString()}`
        : '';

    return apiRequest<PagedAuditLogs>(`/audit-logs${suffix}`);
}