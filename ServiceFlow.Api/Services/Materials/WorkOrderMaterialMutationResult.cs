using ServiceFlow.Api.Contracts.Materials;

namespace ServiceFlow.Api.Services.Materials;

public sealed record WorkOrderMaterialMutationResult(
    WorkOrderMaterialOperationStatus Status,
    WorkOrderMaterialResponse? MaterialUsage 
);