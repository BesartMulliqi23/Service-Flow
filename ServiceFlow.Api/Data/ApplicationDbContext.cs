using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Data;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> dbContextOptions) 
    : IdentityDbContext<ApplicationUser>(dbContextOptions)
{
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<Invitation> Invitations => Set<Invitation>();
    
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>()
            .Property(x => x.DisplayName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Entity<ApplicationUser>()
            .HasOne(u => u.Organization)
            .WithMany(o => o.Users)
            .HasForeignKey(u => u.OrganizationId)
            .IsRequired();

        builder.Entity<Organization>()
            .Property(o => o.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Entity<Invitation>()
            .Property(i => i.Email)
            .HasMaxLength(256)
            .IsRequired();

        builder.Entity<Invitation>()
            .Property(i => i.Role)
            .HasMaxLength(50)
            .IsRequired();

        builder.Entity<Invitation>()
            .Property(i => i.Token)
            .HasMaxLength(200)
            .IsRequired();

        builder.Entity<Invitation>()
            .HasOne(i => i.Organization)
            .WithMany()
            .HasForeignKey(i => i.OrganizationId)
            .IsRequired();

        builder.Entity<Invitation>()
            .HasIndex(i => new { i.OrganizationId, i.Email })
            .IsUnique();
    }
}