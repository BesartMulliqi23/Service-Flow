namespace ServiceFlow.Api.Contracts.Materials;

public sealed record CreateMaterialRequest(
    string? Name,
    string? Sku,
    string? UnitOfMeasure,
    decimal? DefaultUnitCost
);