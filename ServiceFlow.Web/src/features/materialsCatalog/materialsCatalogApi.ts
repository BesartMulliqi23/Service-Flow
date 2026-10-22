import { apiRequest } from "../../api/apiClient";

export type Material = {
    id: string,
    name: string,
    sku: string | null,
    unitOfMeasure: string,
    defaultUnitCost: number,
    isActive: boolean,
    createdUtc: string,
    updatedUtc: string | null
};

export function getMaterials(includeInactive: boolean) {
    const query = new URLSearchParams({
        includeInactive: String(includeInactive)
    });

    return apiRequest<Material[]>(`/materials?${query.toString()}`);
}