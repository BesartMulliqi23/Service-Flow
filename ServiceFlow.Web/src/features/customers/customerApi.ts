import { apiRequest } from "../../api/apiClient";

export interface Customer {
    id: string,
    name: string,
    contactName: string | null,
    email: string | null,
    phoneNumber: string | null,
    notes: string | null,
    isActive: boolean,
    createdUtc: string,
    updatedUtc: string | null
}

export function getCustomers(includeInactive: boolean) {
    const query = new URLSearchParams({
        includeInactive: String(includeInactive)
    });

    return apiRequest<Customer[]>(`/customers?${query.toString()}`);
}