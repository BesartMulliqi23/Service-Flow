namespace ServiceFlow.Api.Contracts.Materials;

public sealed record WorkOrderMaterialResponse(
    Guid Id,
    Guid MaterialId,
    string MaterialName,
    string UnitOfMeasure,
    decimal Quantity,
    decimal UnitCost,
    decimal LineTotal,
    DateTime AddedUtc,
    DateTime? UpdatedUtc
);