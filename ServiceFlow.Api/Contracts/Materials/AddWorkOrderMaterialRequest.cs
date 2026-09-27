namespace ServiceFlow.Api.Contracts.Materials;

public sealed record AddWorkOrderMaterialRequest(
    Guid MaterialId,
    decimal? Quantity,
    decimal? UnitCost
);