import { apiRequest } from "../../api/apiClient";
import type { PagedResponse } from "../../api/pagincation";

export interface ServiceLocation {
    id: string,
    customerId: string,
    customerName: string,
    name: string,
    addressLine1: string,
    addressLine2: string | null,
    city: string,
    postalCode: string | null,
    country: string,
    accessInstructions: string | null,
    isActive: boolean,
    createdUtc: string,
    updatedUtc: string | null
}

export interface ServiceLocationLookup {
    id: string,
    customerId: string,
    customerName: string,
    name: string,
    isActive: boolean
}

export interface ServiceLocationInput {
    customerId: string;
    name: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    postalCode: string;
    country: string;
    accessInstructions: string;
}

interface GetServiceLocationParams {
    search?: string,
    customerId?: string,
    includeInactive: boolean,
    page: number,
    pageSize: number
}

export function getServiceLocations({
    search,
    customerId,
    includeInactive,
    page,
    pageSize
}: GetServiceLocationParams) {
    const query = new URLSearchParams({
        includeInactive: String(includeInactive),
        page: String(page),
        pageSize: String(pageSize)
    });

    if (search?.trim()) {
        query.set('search', search.trim());
    }

    if (customerId) {
        query.set('customerId', customerId);
    }

    return apiRequest<PagedResponse<ServiceLocation>>(`/service-locations?${query.toString()}`);
}

export function getServiceLocationLookup(includeInactive: boolean) {
    const query = new URLSearchParams({
        includeInactive: String(includeInactive)
    });

    return apiRequest<ServiceLocation[]>(`/service-locations/lookup?${query.toString()}`);
}

export function createServiceLocation(input: ServiceLocationInput) {
    return apiRequest<ServiceLocation>('/service-locations', {
        method: 'POST',
        body: JSON.stringify(input)
    });
}

export function updateServiceLocation(serviceLocationId: string, input: ServiceLocationInput) {
    return apiRequest<ServiceLocation>(`/service-locations/${serviceLocationId}`, {
        method: 'PUT',
        body: JSON.stringify({
            name: input.name,
            addressLine1: input.addressLine1,
            addressLine2: input.addressLine2,
            city: input.city,
            postalCode: input.postalCode,
            country: input.country,
            accessInstructions: input.accessInstructions
        })
    });
}

export function deactivateServiceLocation(serviceLocationId: string) {
    return apiRequest<void>(`/service-locations/${serviceLocationId}/deactivate`, {
        method: 'POST'
    });
}