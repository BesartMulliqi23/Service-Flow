using ServiceFlow.Api.Contracts.Materials;

namespace ServiceFlow.Api.Services.Materials;

public sealed record MaterialCatalogMutationResult(
    MaterialCatalogMutationStatus Status,
    MaterialResponse? Material
);