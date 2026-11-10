import { apiRequest } from "../../api/apiClient";
import type { PagedResponse } from "../../api/pagination";

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

export interface CustomerLookup {
    id: string,
    name: string
}

export interface CustomerInput {
    name: string,
    contactName: string,
    email: string,
    phoneNumber: string,
    notes: string
}

export interface GetCustomersParams {
    search?: string,
    includeInactive: boolean,
    page: number,
    pageSize: number
}

export function getCustomers({
    search,
    includeInactive,
    page,
    pageSize
}: GetCustomersParams) {
    const query = new URLSearchParams({
        includeInactive: String(includeInactive),
        page: String(page),
        pageSize: String(pageSize)
    });

    if (search?.trim()) {
        query.set('search', search.trim());
    }

    return apiRequest<PagedResponse<Customer>>(`/customers?${query.toString()}`);
}

export function getActiveCustomerLookup() {
    return apiRequest<CustomerLookup[]>('/customers/lookup');
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

export function deactivateCustomer(customerId: string) {
    return apiRequest<void>(`/customers/${customerId}/deactivate`, {
        method: 'POST'
    });
}