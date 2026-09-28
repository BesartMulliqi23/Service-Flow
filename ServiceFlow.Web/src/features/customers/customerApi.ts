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

export interface CustomerInput {
    name: string,
    contactName: string,
    email: string,
    phoneNumber: string,
    notes: string
}

export function getCustomers(includeInactive: boolean) {
    const query = new URLSearchParams({
        includeInactive: String(includeInactive)
    });

    return apiRequest<Customer[]>(`/customers?${query.toString()}`);
}

export function createCustomer(input: CustomerInput) {
    return apiRequest<Customer>('/customers', {
        method: 'POST',
        body: JSON.stringify(input)
    });
}

export function updateCustomer(customerId: string, input: CustomerInput) {
    return apiRequest<Customer>(`/customers/${customerId}`, {
        method: 'PUT',
        body: JSON.stringify(input)
    });
}