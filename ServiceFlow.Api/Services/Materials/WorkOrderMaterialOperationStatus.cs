namespace ServiceFlow.Api.Services.Materials;

public enum WorkOrderMaterialOperationStatus
{
    Success,
    WorkOrderNotFound,
    MaterialNotFound,
    MaterialInactive,
    UsageLineNotFound,
    DuplicateMaterialLine,
    WorkOrderNotInProgress
}