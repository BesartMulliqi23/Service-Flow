import { apiRequest } from "../../api/apiClient"

export interface Technician {
    id: string,
    displayName: string,
    email: string
}

export function getTechnicians() {
    return apiRequest<Technician[]>('/technicians');
}