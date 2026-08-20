using Microsoft.EntityFrameworkCore;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.ServiceLocations;
using ServiceFlow.Api.Data;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.ServiceLocations;

public sealed class ServiceLocationService(
    ApplicationDbContext dbContext,
    ICurrentOrganization currentOrganization
) : IServiceLocationService
{
    public async Task<CreateServiceLocationResult> CreateAsync(
        CreateServiceLocationRequest request, 
        CancellationToken cancellationToken
    )
    {
        var organizationId = currentOrganization.OrganizationId;

        var customer = await dbContext.Customers
            .SingleOrDefaultAsync(
                customer => customer.Id == request.CustomerId && customer.OrganizationId == organizationId,
                cancellationToken
            );

        if (customer is null)
        {
            return new CreateServiceLocationResult(CreateServiceLocationStatus.CustomerNotFound, null);
        }

        if (!customer.IsActive)
        {
            return new CreateServiceLocationResult(CreateServiceLocationStatus.CustomerInactive, null);
        }

        var serviceLocation = new ServiceLocation
        {
            OrganizationId = organizationId,
            CustomerId = customer.Id,
            Name = request.Name!.Trim(),
            AddressLine1 = request.AddressLine1!.Trim(),
            AddressLine2 = NormalizeOptionalValue(request.AddressLine2),
            City = request.City!.Trim(),
            PostalCode = NormalizeOptionalValue(request.PostalCode),
            Country = request.Country!.Trim(),
            AccessInstructions = NormalizeOptionalValue(request.AccessInstructions),
            IsActive = true,
            CreatedUtc = DateTime.UtcNow
        };

        dbContext.ServiceLocations.Add(serviceLocation);

        await dbContext.SaveChangesAsync(cancellationToken);

        return new CreateServiceLocationResult(
            CreateServiceLocationStatus.Success, 
            ToResponse(serviceLocation, customer.Name)
        );
    }

    public async Task<IReadOnlyList<ServiceLocationResponse>> GetAllAsync(
        Guid? customerId, 
        bool includeInactive, 
        CancellationToken cancellationToken
    )
    {
        var organizationId = currentOrganization.OrganizationId;

        var query = dbContext.ServiceLocations
            .AsNoTracking()
            .Where(location => location.OrganizationId == organizationId);

        if (customerId.HasValue)
        {
            query = query.Where(location => location.CustomerId == customerId.Value);
        }

        if (!includeInactive)
        {
            query = query.Where(location => location.IsActive);
        }

        return await query
            .OrderBy(location => location.Customer.Name)
            .ThenBy(location => location.Name)
            .Select(location => new ServiceLocationResponse(
                location.Id,
                location.CustomerId,
                location.Customer.Name,
                location.Name,
                location.AddressLine1,
                location.AddressLine2,
                location.City,
                location.PostalCode,
                location.Country,
                location.AccessInstructions,
                location.IsActive,
                location.CreatedUtc,
                location.UpdatedUtc
            ))
            .ToListAsync(cancellationToken);
    }

    public async Task<ServiceLocationResponse?> GetByIdAsync(Guid serviceLocationId, CancellationToken cancellationToken)
    {
        var organizationId = currentOrganization.OrganizationId;

        var location = await dbContext.ServiceLocations
            .AsNoTracking()
            .Include(location => location.Customer)
            .SingleOrDefaultAsync(
                location => location.Id == serviceLocationId && location.OrganizationId == organizationId,
                cancellationToken
            );

        return location is null ? null : ToResponse(location, location.Customer.Name);
    }

    public async Task<ServiceLocationResponse?> UpdateAsync(
        Guid serviceLocationId, 
        UpdateServiceLocationRequest request, 
        CancellationToken cancellationToken
    )
    {
        var organizationId = currentOrganization.OrganizationId;

        var location = await dbContext.ServiceLocations
            .Include(location => location.Customer)
            .SingleOrDefaultAsync(
                location => location.Id == serviceLocationId && location.OrganizationId == organizationId,
                cancellationToken
            );

        if (location is null)
        {
            return null;
        }

        location.Name = request.Name!.Trim();
        location.AddressLine1 = request.AddressLine1!.Trim();
        location.AddressLine2 = NormalizeOptionalValue(request.AddressLine2);
        location.City = request.City!.Trim();
        location.PostalCode = NormalizeOptionalValue(request.PostalCode);
        location.Country = request.Country!.Trim();
        location.AccessInstructions = NormalizeOptionalValue(request.AccessInstructions);
        location.UpdatedUtc = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        return ToResponse(location, location.Customer.Name);
    }

    public async Task<bool> DeactivateAsync(Guid serviceLocationId, CancellationToken cancellationToken)
    {
        var organizationId = currentOrganization.OrganizationId;

        var location = await dbContext.ServiceLocations
            .SingleOrDefaultAsync(
                location => location.Id == serviceLocationId && location.OrganizationId == organizationId,
                cancellationToken
            );

        if (location is null)
        {
            return false;
        }

        if (!location.IsActive)
        {
            return true;
        }

        location.IsActive = false;
        location.UpdatedUtc = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }

    private static string? NormalizeOptionalValue(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static ServiceLocationResponse ToResponse(ServiceLocation location, string customerName)
    {
        return new ServiceLocationResponse(
            location.Id,
            location.CustomerId,
            customerName,
            location.Name,
            location.AddressLine1,
            location.AddressLine2,
            location.City,
            location.PostalCode,
            location.Country,
            location.AccessInstructions,
            location.IsActive,
            location.CreatedUtc,
            location.UpdatedUtc
        );
    }
}