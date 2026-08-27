using ServiceFlow.Api.Contracts.Technicians;

namespace ServiceFlow.Api.Services.Technicians;

public interface ITechnicianDirectoryService
{
    Task<IReadOnlyList<TechnicianResponse>> GetAllAsync(CancellationToken cancellationToken);
}