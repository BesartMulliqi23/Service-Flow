using ServiceFlow.Api.Contracts.Customers;

namespace ServiceFlow.Api.Services.Customers;

public interface ICustomerService
{
    Task<CustomerResponse> CreateAsync(CreateCustomerRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<CustomerResponse>> GetAllAsync(bool includeInactive, CancellationToken cancellationToken);

    Task<CustomerResponse?> GetByIdAsync(Guid customerId, CancellationToken cancellationToken);

    Task<CustomerResponse?> UpdateAsync(Guid customerId, UpdateCustomerRequest request, CancellationToken cancellationToken);

    Task<bool> DeactivateAsync(Guid customerId, CancellationToken cancellationToken);
}