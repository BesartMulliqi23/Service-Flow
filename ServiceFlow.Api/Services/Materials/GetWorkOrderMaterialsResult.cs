using ServiceFlow.Api.Contracts.Materials;

namespace ServiceFlow.Api.Services.Materials;

public sealed record GetWorkOrderMaterialsResult(
    WorkOrderMaterialOperationStatus Status,
    IReadOnlyList<WorkOrderMaterialResponse> Materials
);