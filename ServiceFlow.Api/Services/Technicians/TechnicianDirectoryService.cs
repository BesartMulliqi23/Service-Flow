using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Contracts.Technicians;
using ServiceFlow.Api.Data;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Services.Technicians;

public sealed class TechnicianDirectoryService(
    ApplicationDbContext dbContext,
    RoleManager<IdentityRole> roleManager,
    ICurrentOrganization currentOrganization
) : ITechnicianDirectoryService
{
    public async Task<IReadOnlyList<TechnicianResponse>> GetAllAsync(CancellationToken cancellationToken)
    {
        var technicianRole = await roleManager.FindByNameAsync(ApplicationRoles.Technician);

        if (technicianRole is null)
        {
            return [];
        }

        var organizationId = currentOrganization.OrganizationId;

        return await (
            from user in dbContext.Users.AsNoTracking()
            join userRole in dbContext.UserRoles
                on user.Id equals userRole.UserId
            where user.OrganizationId == organizationId &&
                userRole.RoleId == technicianRole.Id
            orderby user.DisplayName
            select new TechnicianResponse(
                user.Id,
                user.DisplayName,
                user.Email!
            )
        ).ToListAsync(cancellationToken);
    }
}