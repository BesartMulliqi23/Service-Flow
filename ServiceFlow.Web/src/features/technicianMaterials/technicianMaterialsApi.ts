import { apiRequest } from "../../api/apiClient"

export interface TechnicianMaterial {
    id: string,
    name: string,
    sku: string | null,
    unitOfMeasure: string,
    defaultUnitCost: number,
    isActive: boolean,
    createdUtc: string,
    updatedUtc: string | null
}

export interface WorkOrderMaterialUsage {
    id: string,
    materialId: string,
    materialName: string,
    unitOfMeasure: string,
    quantity: number,
    unitCost: number,
    lineTotal: number,
    addedUtc: string,
    updatedUtc: string | null
}

export interface AddWorkOrderMaterialInput {
    materialId: string,
    quantity: number,
    unitCost?: number
} 

export interface UpdateWorkOrderMaterialInput {
    quantity: number,
    unitCost?: number
}

export function getTechnicianMaterials() {
    return apiRequest<TechnicianMaterial[]>('/technician/materials');
}

export function getWorkOrderMaterials(workOrderId: string) {
    return apiRequest<WorkOrderMaterialUsage[]>(`/workorders/${workOrderId}/materials`);
}

export function addWorkOrderMaterial(workOrderId: string, input: AddWorkOrderMaterialInput) {
    return apiRequest<WorkOrderMaterialUsage>(`/workorders/${workOrderId}/materials`, {
        method: 'POST',
        body: JSON.stringify(input)
    });
}

export function updateWorkOrderMaterial(workOrderId: string, workOrderMaterialId: string, input: UpdateWorkOrderMaterialInput) {
    return apiRequest<WorkOrderMaterialUsage>(`/workorders/${workOrderId}/materials/${workOrderMaterialId}`, {
        method: 'PUT',
        body: JSON.stringify(input)
    });
}

export function removeWorkOrderMaterial(workOrderId: string, workOrderMaterialId: string) {
    return apiRequest<void>(`/workorders/${workOrderId}/materials/${workOrderMaterialId}`, {
        method: 'DELETE'
    });
}