using Microsoft.EntityFrameworkCore;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.Materials;
using ServiceFlow.Api.Data;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.Materials;

public sealed class MaterialCatalogService(
    ApplicationDbContext dbContext,
    ICurrentOrganization currentOrganization
) : IMaterialCatalogService
{
    public async Task<MaterialCatalogMutationResult> CreateAsync(
        CreateMaterialRequest request,
        CancellationToken cancellationToken
    )
    {
        var organizationId = currentOrganization.OrganizationId;
        var sku = NormalizeOptionalValue(request.Sku);

        if (await HasActiveMaterialWithSkuAsync(
            organizationId,
            sku,
            null,
            cancellationToken
        ))
        {
            return new MaterialCatalogMutationResult(
                MaterialCatalogMutationStatus.DuplicateSku,
                null
            );
        }

        var material = new Material
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            Name = request.Name!.Trim(),
            Sku = sku,
            UnitOfMeasure = request.UnitOfMeasure!.Trim(),
            DefaultUnitCost = request.DefaultUnitCost!.Value,
            IsActive = true,
            CreatedUtc = DateTime.UtcNow
        };

        dbContext.Materials.Add(material);

        await dbContext.SaveChangesAsync(cancellationToken);

        return new MaterialCatalogMutationResult(
            MaterialCatalogMutationStatus.Success,
            ToResponse(material)
        );
    }

    public async Task<IReadOnlyList<MaterialResponse>> GetAllAsync(
        bool includeInactive, 
        CancellationToken cancellationToken
    )
    {
        var organizationId = currentOrganization.OrganizationId;

        var query = dbContext.Materials
            .AsNoTracking()
            .Where(material => material.OrganizationId == organizationId);

        if (!includeInactive)
        {
            query = query.Where(material => material.IsActive);
        }

        return await query
            .OrderByDescending(material => material.IsActive)
            .ThenBy(material => material.Name)
            .Select(material => new MaterialResponse(
                material.Id,
                material.Name,
                material.Sku,
                material.UnitOfMeasure,
                material.DefaultUnitCost,
                material.IsActive,
                material.CreatedUtc,
                material.UpdatedUtc
            ))
            .ToListAsync(cancellationToken);
    }

    public async Task<MaterialResponse?> GetByIdAsync(
        Guid materialId,
        CancellationToken cancellationToken
    )
    {
        var organizationId = currentOrganization.OrganizationId;

        var material = await dbContext.Materials
            .AsNoTracking()
            .SingleOrDefaultAsync(
                material =>
                    material.OrganizationId == organizationId &&
                    material.Id == materialId,
                cancellationToken
            );

        return material is null ? null : ToResponse(material);
    }

    public async Task<MaterialCatalogMutationResult> UpdateAsync(
        Guid materialId, 
        UpdateMaterialRequest request,
        CancellationToken cancellationToken
    )
    {
        var organizationId = currentOrganization.OrganizationId;

        var material = await dbContext.Materials
            .SingleOrDefaultAsync(
                material =>
                    material.OrganizationId == organizationId &&
                    material.Id == materialId,
                cancellationToken
            );

        if (material is null)
        {
            return new MaterialCatalogMutationResult(
                MaterialCatalogMutationStatus.NotFound,
                null
            );
        }

        var sku = NormalizeOptionalValue(request.Sku);

        if (
            material.IsActive &&
            await HasActiveMaterialWithSkuAsync(
                organizationId,
                sku,
                material.Id,
                cancellationToken
            )
        )
        {
            return new MaterialCatalogMutationResult(
                MaterialCatalogMutationStatus.DuplicateSku,
                null
            );
        }

        material.Name = request.Name!.Trim();
        material.Sku = sku;
        material.UnitOfMeasure = request.UnitOfMeasure!.Trim();
        material.DefaultUnitCost = request.DefaultUnitCost!.Value;
        material.UpdatedUtc = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        return new MaterialCatalogMutationResult(
            MaterialCatalogMutationStatus.Success,
            ToResponse(material)
        );
    }

    public async Task<MaterialCatalogMutationStatus> DeactiveAsync(
        Guid materialId,
        CancellationToken cancellationToken
    )
    {
        var organizationId = currentOrganization.OrganizationId;

        var material = await dbContext.Materials
            .SingleOrDefaultAsync(
                material =>
                    material.OrganizationId == organizationId &&
                    material.Id == materialId,
                cancellationToken
            );

        if (material is null)
        {
            return MaterialCatalogMutationStatus.NotFound;
        }

        if (!material.IsActive)
        {
            return MaterialCatalogMutationStatus.Success;
        }

        material.IsActive = false;
        material.UpdatedUtc = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        return MaterialCatalogMutationStatus.Success;
    }

    private async Task<bool> HasActiveMaterialWithSkuAsync(
        Guid organizationId,
        string? sku,
        Guid? excludedMaterialId,
        CancellationToken cancellationToken
    )
    {
        if (sku is null)
        {
            return false;
        }

        return await dbContext.Materials.AnyAsync(
            material =>
                material.OrganizationId == organizationId &&
                material.IsActive &&
                material.Sku == sku &&
                (!excludedMaterialId.HasValue || material.Id != excludedMaterialId.Value),
            cancellationToken
        );
    }

    private static string? NormalizeOptionalValue(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static MaterialResponse ToResponse(Material material)
    {
        return new MaterialResponse(
            material.Id,
            material.Name,
            material.Sku,
            material.UnitOfMeasure,
            material.DefaultUnitCost,
            material.IsActive,
            material.CreatedUtc,
            material.UpdatedUtc
        );
    }
}