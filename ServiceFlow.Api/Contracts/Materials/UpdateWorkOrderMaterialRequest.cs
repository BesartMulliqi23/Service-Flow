namespace ServiceFlow.Api.Contracts.Materials;

public sealed record UpdateWorkOrderMaterialRequest(
    decimal? Quantity,
    decimal? UnitCost
);