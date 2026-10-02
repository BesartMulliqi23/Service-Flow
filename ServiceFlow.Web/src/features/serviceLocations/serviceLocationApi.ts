import { apiRequest } from "../../api/apiClient";

export interface ServiceLocation {
    id: string,
    customerId: string,
    customerName: string,
    name: string,
    addressLine1: string,
    addressLine2: string | null,
    city: string,
    postalCode: string,
    country: string,
    accessInstructions: string | null,
    isActive: boolean,
    createdUtc: string,
    updatedutc: string | null
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
        inculdeInactive: String(includeInactive)
    });

    if (customerId) {
        query.set('customerId', customerId);
    }

    return apiRequest<ServiceLocation[]>(`/servicelocations?${query.toString()}`);
}