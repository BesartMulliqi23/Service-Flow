import { apiRequest } from "../../api/apiClient";

export type InvitationRole = 'Manager' | 'Dispatcher' | 'Technician';

export type CreateInvitationInput = {
    email: string,
    role: InvitationRole
};

export function createInvitation(input: CreateInvitationInput) {
    return apiRequest<void>('/invitations', {
        method: 'POST',
        body: JSON.stringify(input)
    });
}