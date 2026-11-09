using Microsoft.EntityFrameworkCore;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.Common;
using ServiceFlow.Api.Contracts.Customers;
using ServiceFlow.Api.Data;
using ServiceFlow.Api.Models;
using ServiceFlow.Api.Services.AuditLogging;

namespace ServiceFlow.Api.Services.Customers;

public sealed class CustomerService(
    ApplicationDbContext dbContext,
    ICurrentOrganization currentOrganization,
    IAuditLogWriter auditLogWriter
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

        await auditLogWriter.AddAsync(
            AuditLogAction.CustomerCreated,
            AuditEntityTypes.Customer,
            customer.Id,
            $"Created customer \"{customer.Name}\".",
            cancellationToken
        );

        await dbContext.SaveChangesAsync(cancellationToken);

        return ToResponse(customer);
    }

    public async Task<PagedResponse<CustomerResponse>> GetAllAsync(
        string? search,
        bool includeInactive,
        int page,
        int pageSize, 
        CancellationToken cancellationToken
    )
    {
        var organizationId = currentOrganization.OrganizationId;

        var query = dbContext.Customers
            .AsNoTracking()
            .Where(c => c.OrganizationId == organizationId);

        if (!includeInactive)
        {
            query = query.Where(c => c.IsActive);
        }

        var normalizedSearch = NormalizeSearch(search);

        if (normalizedSearch is not null)
        {
            query = query.Where(
                customer =>
                    customer.Name.Contains(normalizedSearch) ||
                    (customer.ContactName != null && customer.ContactName.Contains(normalizedSearch)) ||
                    (customer.Email != null && customer.Email.Contains(normalizedSearch)) ||
                    (customer.PhoneNumber != null && customer.PhoneNumber.Contains(normalizedSearch))
            );
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var customers = await query
            .OrderBy(customer => customer.Name)
            .ThenBy(customer => customer.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(customer => new CustomerResponse(
                customer.Id,
                customer.Name,
                customer.ContactName,
                customer.Email,
                customer.PhoneNumber,
                customer.Notes,
                customer.IsActive,
                customer.CreatedUtc,
                customer.UpdatedUtc
            ))
            .ToListAsync(cancellationToken);

        return new PagedResponse<CustomerResponse>(
            customers,
            page,
            pageSize,
            totalCount,
            (int)Math.Ceiling(totalCount / (double)pageSize)
        );
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

        await auditLogWriter.AddAsync(
            AuditLogAction.CustomerUpdated,
            AuditEntityTypes.Customer,
            customer.Id,
            $"Updated customer \"{customer.Name}\".",
            cancellationToken
        );

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

        await auditLogWriter.AddAsync(
            AuditLogAction.CustomerDeactivated,
            AuditEntityTypes.Customer,
            customer.Id,
            $"Deactivated customer \"{customer.Name}\".",
            cancellationToken
        );

        await dbContext.SaveChangesAsync(cancellationToken);
        
        return true;
    }

    private static string? NormalizeOptionalValue(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static string? NormalizeSearch(string? value)
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