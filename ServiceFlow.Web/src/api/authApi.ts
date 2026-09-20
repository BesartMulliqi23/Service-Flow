import { apiRequest } from './apiClient';

export type LoginRequest = {
    email: string;
    password: string;
};

export type AuthUser = {
    id: string;
    email: string;
    name: string;
    roles: string[];
};

export const authApi = {
    login(credentials: LoginRequest) {
        return apiRequest<AuthUser>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    },

    logout() {
        return apiRequest<void>('/auth/logout', {
            method: 'POST'
        });
    },

    getCurrentUser() {
        return apiRequest<AuthUser>('/auth/me');
    }
};