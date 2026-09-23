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

export type RegisterInput = {
    email: string,
    displayName: string,
    organizationName: string,
    password: string,
    confirmPassword: string
}

type ConfirmationResponse = {
    message: string
}

export function registerUser(input: RegisterInput) {
    return apiRequest<void>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(input)
    });
}

export function confirmEmail(userId: string, token: string) {
    const query = new URLSearchParams({ userId, token });

    return apiRequest<ConfirmationResponse>(`/auth/confirm-email?${query.toString()}`);
}

export function requestPasswordReset(email: string) {
    return apiRequest<void>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
    });
}

export function resetPassword(
    userId: string,
    token: string,
    newPassword: string,
    confirmPassword: string
) {
    return apiRequest<void>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
            userId,
            token,
            newPassword,
            confirmPassword
        })
    });
}