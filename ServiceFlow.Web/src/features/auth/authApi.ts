import { apiRequest } from "../../api/apiClient";

export type CurrentUser = {
    id: string,
    organizationId: string,
    displayName: string,
    email: string,
    emailConfirmed: boolean,
    roles: string[]
}

export type LoginInput = {
    email: string,
    password: string,
    rememberMe: boolean
}

export function getCurrentUser() {
    return apiRequest<CurrentUser>('/auth/me');
}

export function loginUser(input: LoginInput) {
    return apiRequest<void>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(input)
    });
}

export function logoutUser() {
    return apiRequest<void>('/auth/logout', {
        method: 'POST'
    });
}