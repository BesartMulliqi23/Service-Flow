import { apiRequest } from "../../api/apiClient";

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
    customerId?: string,
    includeInactive: boolean
}

export function getServiceLocations({
    customerId,
    includeInactive
}: GetServiceLocationParams) {
    const query = new URLSearchParams({
        includeInactive: String(includeInactive)
    });

    if (customerId) {
        query.set('customerId', customerId);
    }

    return apiRequest<ServiceLocation[]>(`/servicelocations?${query.toString()}`);
}

export function createServiceLocation(input: ServiceLocationInput) {
    return apiRequest<ServiceLocation>('/servicelocations', {
        method: 'POST',
        body: JSON.stringify(input)
    });
}

export function updateServiceLocation(serviceLocationId: string, input: ServiceLocationInput) {
    return apiRequest<ServiceLocation>(`/servicelocations/${serviceLocationId}`, {
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
    return apiRequest<void>(`/servicelocations/${serviceLocationId}/deactivate`, {
        method: 'POST'
    });
}