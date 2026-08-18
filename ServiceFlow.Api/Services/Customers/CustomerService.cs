using Microsoft.EntityFrameworkCore;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.Customers;
using ServiceFlow.Api.Data;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.Customers;

public sealed class CustomerService(
    ApplicationDbContext dbContext,
    ICurrentOrganization currentOrganization
) : ICustomerService
{
    public async Task<CustomerResponse> CreateAsync(CreateCustomerRequest request, CancellationToken cancellationToken)
    {
        var customer = new Customer
        {
            OrganizationId = currentOrganization.OrganizationId,
            Name = request.Name!.Trim(),
            ContactName = NormalizeOptionalValue(request.ContactName),
            Email = NormalizeOptionalValue(request.Email),
            PhoneNumber = NormalizeOptionalValue(request.PhoneNumber),
            Notes = NormalizeOptionalValue(request.Notes),
            IsActive = true,
            CreatedUtc = DateTime.UtcNow
        };

        dbContext.Customers.Add(customer);

        await dbContext.SaveChangesAsync(cancellationToken);

        return ToResponse(customer);
    }

    public async Task<IReadOnlyList<CustomerResponse>> GetAllAsync(bool includeInactive, CancellationToken cancellationToken)
    {
        var organizationId = currentOrganization.OrganizationId;

        var query = dbContext.Customers
            .AsNoTracking()
            .Where(c => c.OrganizationId == organizationId);

        if (!includeInactive)
        {
            query = query.Where(c => c.IsActive);
        }

        return await query
            .OrderBy(c => c.Name)
            .Select(c => new CustomerResponse(
                c.Id,
                c.Name,
                c.ContactName,
                c.Email,
                c.PhoneNumber,
                c.Notes,
                c.IsActive,
                c.CreatedUtc,
                c.UpdatedUtc
            ))
            .ToListAsync(cancellationToken);
    }

    public async Task<CustomerResponse?> GetByIdAsync(Guid customerId, CancellationToken cancellationToken)
    {
        var organizationId = currentOrganization.OrganizationId;

        var customer = await dbContext.Customers
            .AsNoTracking()
            .SingleOrDefaultAsync(
                c => c.Id == customerId && c.OrganizationId == organizationId, 
                cancellationToken
            );
        
        return customer is null ? null : ToResponse(customer);
    }
    
    public async Task<CustomerResponse?> UpdateAsync(Guid customerId, UpdateCustomerRequest request, CancellationToken cancellationToken)
    {
        var organizationId = currentOrganization.OrganizationId;

        var customer = await dbContext.Customers
            .SingleOrDefaultAsync(
                c => c.Id == customerId && c.OrganizationId == organizationId,
                cancellationToken
            );

        if (customer is null)
        {
            return null;
        }

        customer.Name = request.Name!.Trim();
        customer.ContactName = NormalizeOptionalValue(request.ContactName);
        customer.Email = NormalizeOptionalValue(request.Email);
        customer.PhoneNumber = NormalizeOptionalValue(request.PhoneNumber);
        customer.Notes = NormalizeOptionalValue(request.Notes);
        customer.UpdatedUtc = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        return ToResponse(customer);
    }

    public async Task<bool> DeactivateAsync(Guid customerId, CancellationToken cancellationToken)
    {
        var organizationId = currentOrganization.OrganizationId;

        var customer = await dbContext.Customers
            .SingleOrDefaultAsync(
                c => c.Id == customerId && c.OrganizationId == organizationId,
                cancellationToken
            );

        if (customer is null)
        {
            return false;
        }

        if (!customer.IsActive)
        {
            return true;
        }

        customer.IsActive = false;
        customer.UpdatedUtc = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
        
        return true;
    }

    private static string? NormalizeOptionalValue(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static CustomerResponse ToResponse(Customer customer)
    {
        return new CustomerResponse(
            customer.Id,
            customer.Name,
            customer.ContactName,
            customer.Email,
            customer.PhoneNumber,
            customer.Notes,
            customer.IsActive,
            customer.CreatedUtc,
            customer.UpdatedUtc
        );
    }
}