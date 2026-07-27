using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Data;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> dbContextOptions) 
    : IdentityDbContext<ApplicationUser>(dbContextOptions)
{
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>()
            .Property(x => x.DisplayName)
            .HasMaxLength(200)
            .IsRequired();
    }
}