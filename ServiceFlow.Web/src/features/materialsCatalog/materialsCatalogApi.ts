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

export type MaterialInput = {
    name: string,
    sku: string,
    unitOfMeasure: string,
    defaultUnitCost: number
};

export function getMaterials(includeInactive: boolean) {
    const query = new URLSearchParams({
        includeInactive: String(includeInactive)
    });

    return apiRequest<Material[]>(`/materials?${query.toString()}`);
}

export function createMaterial(input: MaterialInput) {
    return apiRequest<Material>('/materials', {
        method: 'POST',
        body: JSON.stringify(input)
    });
}

export function updateMaterial(materialId: string, input: MaterialInput) {
    return apiRequest<Material>(`/materials/${materialId}`, {
        method: 'PUT',
        body: JSON.stringify(input)
    });
}

export function deactivateMaterial(materialId: string) {
    return apiRequest<void>(`/materials/${materialId}/deactivate`, {
        method: 'POST'
    });
}