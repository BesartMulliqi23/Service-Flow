import { apiRequest } from "../../api/apiClient";

export type InvitationRole = 'Manager' | 'Dispatcher' | 'Technician';

export type CreateInvitationInput = {
    email: string,
    role: InvitationRole
};

export type InvitationDetails = {
    email: string,
    organizationName: string,
    role: string
};

export type CompleteInvitationInput = {
    token: string,
    displayName: string,
    password: string,
    confirmPassword: string
};

export function createInvitation(input: CreateInvitationInput) {
    return apiRequest<void>('/invitations', {
        method: 'POST',
        body: JSON.stringify(input)
    });
}

export function getInvitation(token: string) {
    const query = new URLSearchParams({ token });

    return apiRequest<InvitationDetails>(`/invitations/accept?${query.toString()}`);
}

export function completeInvitation(input: CompleteInvitationInput) {
    return apiRequest<void>('/invitations/accept', {
        method: 'POST',
        body: JSON.stringify(input)
    });
}