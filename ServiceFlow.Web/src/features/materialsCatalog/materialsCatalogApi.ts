import { apiRequest } from "../../api/apiClient";
import type { PagedResponse } from "../../api/pagination";

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

export type GetMaterialParams = {
    search?: string,
    includeInactive: boolean,
    page: number,
    pageSize: number
};

export function getMaterials({
    search,
    includeInactive,
    page,
    pageSize
}: GetMaterialParams) {
    const query = new URLSearchParams({
        includeInactive: String(includeInactive),
        page: String(page),
        pageSize: String(pageSize)
    });

    if (search?.trim()) {
        query.set('search', search.trim());
    }

    return apiRequest<PagedResponse<Material>>(`/materials?${query.toString()}`);
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