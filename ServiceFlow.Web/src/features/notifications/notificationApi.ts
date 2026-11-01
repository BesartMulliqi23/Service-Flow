import { apiRequest } from "../../api/apiClient";

export type WorkOrderNotificationType =
    'TechnicianAssigned' |
    'WorkOrderRescheduled' |
    'UpcomingWorkOrderReminder';

export interface WorkOrderNotification {
    id: string,
    workOrderId: string,
    type: WorkOrderNotificationType,
    title: string,
    message: string,
    scheduledStartUtc: string | null,
    createdUtc: string,
    isRead: boolean
}

interface UnreadNotificationCountResponse {
    count: number
}

export function getNotifications(take = 20) {
    return apiRequest<WorkOrderNotification[]>(`/notifications?take=${take}`);
}

export function getUnreadNotificationCount() {
    return apiRequest<UnreadNotificationCountResponse>('/notifications/unread-count');
}

export function markNotificationAsRead(notificationId: string) {
    return apiRequest<void>(`/notifications/${notificationId}/read`, {
        method: 'POST'
    });
}

export function markAllNotificationsAsRead() {
    return apiRequest<void>(`/notifications/read-all`, {
        method: 'POST'
    });
}