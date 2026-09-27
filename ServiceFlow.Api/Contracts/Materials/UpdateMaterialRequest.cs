namespace ServiceFlow.Api.Contracts.Materials;

public sealed record UpdateMaterialRequest(
    string? Name,
    string? Sku,
    string? UnitOfMeasure,
    decimal? DefaultUnitCost
);