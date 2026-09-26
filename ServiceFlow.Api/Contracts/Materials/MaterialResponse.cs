namespace ServiceFlow.Api.Contracts.Materials;

public sealed record MaterialResponse(
    Guid Id,
    string Name,
    string? Sku,
    string UnitOfMeasure,
    decimal DefaultUnitCost,
    bool IsActive,
    DateTime CreatedUtc,
    DateTime? UpdatedUtc
);