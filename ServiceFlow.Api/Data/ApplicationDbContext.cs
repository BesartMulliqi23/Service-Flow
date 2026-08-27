using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Data;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> dbContextOptions) 
    : IdentityDbContext<ApplicationUser>(dbContextOptions)
{
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<Invitation> Invitations => Set<Invitation>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<ServiceLocation> ServiceLocations => Set<ServiceLocation>();
    public DbSet<WorkOrder> WorkOrders => Set<WorkOrder>();
    public DbSet<WorkOrderAssignment> WorkOrderAssignments => Set<WorkOrderAssignment>();
    public DbSet<WorkOrderStatusChange> WorkOrderStatusChanges => Set<WorkOrderStatusChange>();
    
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

        builder.Entity<ApplicationUser>()
            .HasAlternateKey(user => new
            {
                user.Id,
                user.OrganizationId
            });

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

        builder.Entity<Customer>(entity =>
        {
            entity.Property(customer => customer.Name)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(customer => customer.ContactName)
                .HasMaxLength(200);

            entity.Property(customer => customer.Email)
                .HasMaxLength(256);

            entity.Property(customer => customer.PhoneNumber)
                .HasMaxLength(50);

            entity.Property(customer => customer.Notes)
                .HasMaxLength(2000);

            entity.HasOne<Organization>()
                .WithMany()
                .HasForeignKey(customer => customer.OrganizationId)
                .IsRequired();

            entity.HasIndex(customer => new
            {
                customer.OrganizationId,
                customer.IsActive,
                customer.Name
            });

            entity.HasAlternateKey(customer => new
            {
                customer.Id,
                customer.OrganizationId
            });
        });

        builder.Entity<ServiceLocation>(entity =>
        {
            entity.Property(location => location.Name)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(location => location.AddressLine1)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(location => location.AddressLine2)
                .HasMaxLength(200);

            entity.Property(location => location.City)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(location => location.PostalCode)
                .HasMaxLength(20);

            entity.Property(location => location.Country)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(location => location.AccessInstructions)
                .HasMaxLength(1000);

            entity.HasOne(location => location.Customer)
                .WithMany()
                .HasForeignKey(location => new
                {
                    location.CustomerId,
                    location.OrganizationId
                })
                .HasPrincipalKey(customer => new
                {
                    customer.Id,
                    customer.OrganizationId
                })
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(location => new
            {
                location.OrganizationId,
                location.CustomerId,
                location.IsActive,
                location.Name
            });

            entity.HasAlternateKey(location => new
            {
                location.Id,
                location.OrganizationId
            });
        });

        builder.Entity<WorkOrder>(entity =>
        {
            entity.Property(workOrder => workOrder.Title)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(workOrder => workOrder.Description)
                .HasMaxLength(4000)
                .IsRequired();

            entity.Property(workOrder => workOrder.Priority)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(workOrder => workOrder.Status)
                .HasConversion<string>()
                .HasMaxLength(50)
                .IsRequired();

            entity.HasOne(workOrder => workOrder.ServiceLocation)
                .WithMany()
                .HasForeignKey(workOrder => new
                {
                    workOrder.ServiceLocationId,
                    workOrder.OrganizationId
                })
                .HasPrincipalKey(serviceLocation => new
                {
                    serviceLocation.Id,
                    serviceLocation.OrganizationId
                })
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(workOrder => new
            {
                workOrder.OrganizationId,
                workOrder.Status,
                workOrder.ScheduledStartUtc
            });

            entity.HasAlternateKey(workOrder => new
            {
                workOrder.Id,
                workOrder.OrganizationId
            });
        });

        builder.Entity<WorkOrderAssignment>(entity =>
        {
            entity.HasKey(assignment => new
            {
                assignment.WorkOrderId,
                assignment.TechnicianId
            });

            entity.HasOne(assignment => assignment.WorkOrder)
                .WithMany(workOrder => workOrder.Assignments)
                .HasForeignKey(assignment => new
                {
                    assignment.WorkOrderId,
                    assignment.OrganizationId
                })
                .HasPrincipalKey(workOrder => new
                {
                    workOrder.Id,
                    workOrder.OrganizationId
                })
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(assignment => assignment.Technician)
                .WithMany(user => user.WorkOrderAssignments)
                .HasForeignKey(assignment => new
                {
                    assignment.TechnicianId,
                    assignment.OrganizationId
                })
                .HasPrincipalKey(user => new
                {
                    user.Id,
                    user.OrganizationId
                })
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(assignment => new
            {
                assignment.OrganizationId,
                assignment.TechnicianId
            });
        });

        builder.Entity<WorkOrderStatusChange>(entity =>
        {
            entity.Property(statusChange => statusChange.PreviousStatus)
                .HasConversion<string>()
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(statusChange => statusChange.NewStatus)
                .HasConversion<string>()
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(statusChange => statusChange.Note)
                .HasMaxLength(4000);

            entity.HasOne(statusChange => statusChange.WorkOrder)
                .WithMany(workOrder => workOrder.StatusHistory)
                .HasForeignKey(statusChange => new
                {
                    statusChange.WorkOrderId,
                    statusChange.OrganizationId
                })
                .HasPrincipalKey(workOrder => new
                {
                    workOrder.Id,
                    workOrder.OrganizationId
                })
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(statusChange => statusChange.ChangedByUser)
                .WithMany(user => user.WorkOrderStatusChanges)
                .HasForeignKey(statusChange => new
                {
                    statusChange.ChangedByUserId,
                    statusChange.OrganizationId
                })
                .HasPrincipalKey(user => new
                {
                    user.Id,
                    user.OrganizationId
                })
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(statusChange => new
            {
                statusChange.OrganizationId,
                statusChange.WorkOrderId,
                statusChange.ChangedUtc
            });
        });
    }
}