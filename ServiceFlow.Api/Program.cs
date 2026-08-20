using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ServiceFlow.Api.Authorization;
using ServiceFlow.Api.Data;
using ServiceFlow.Api.Models;
using ServiceFlow.Api.Services.Authentication;
using ServiceFlow.Api.Services.Customers;
using ServiceFlow.Api.Services.Email;
using ServiceFlow.Api.Services.Invitations;
using ServiceFlow.Api.Services.OrganizationOnboarding;
using ServiceFlow.Api.Services.ServiceLocations;
using ServiceFlow.Api.Settings;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlServer(connectionString);
});

builder.Services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>();

builder.Services.AddControllers();

builder.Services.Configure<SmtpOptions>(
    builder.Configuration.GetSection(SmtpOptions.SectionName)
);

builder.Services.Configure<FrontendOptions>(
    builder.Configuration.GetSection(FrontendOptions.SectionName)
);

builder.Services.Configure<GoogleAuthenticationOptions>(
    builder.Configuration.GetSection(GoogleAuthenticationOptions.SectionName)
);

builder.Services.Configure<MicrosoftAuthenticationOptions>(
    builder.Configuration.GetSection(MicrosoftAuthenticationOptions.SectionName)
);

builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();
builder.Services.AddScoped<IExternalAuthService, ExternalAuthService>();
builder.Services.AddScoped<IOrganizationOnboardingService, OrganizationOnboardingService>();
builder.Services.AddScoped<IInvitationService, InvitationService>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<IServiceLocationService, ServiceLocationService>();

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(
        OrganizationPolicies.ManageMembers,
        policy => policy.RequireRole(ApplicationRoles.Owner)
    );

    options.AddPolicy(
        OrganizationPolicies.ManageCustomers,
        policy => policy.RequireRole(OrganizationPolicies.OperationsManagers)
    );

    options.AddPolicy(
        OrganizationPolicies.ManageWorkOrders,
        policy => policy.RequireRole(OrganizationPolicies.OperationsManagers)
    );

    options.AddPolicy(
        OrganizationPolicies.ViewReports,
        policy => policy.RequireRole(ApplicationRoles.Owner, ApplicationRoles.Manager)
    );

    options.AddPolicy(
        OrganizationPolicies.ViewWorkOrders,
        policy => policy.RequireRole(OrganizationPolicies.AllOrganizationRoles)
    );

    options.AddPolicy(
        OrganizationPolicies.ExecuteAssignedWork,
        policy => policy.RequireRole(ApplicationRoles.Technician)
    );
});

builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.User.RequireUniqueEmail = true;
    options.SignIn.RequireConfirmedEmail = true;

    options.Password.RequiredLength = 12;
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;

    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
})
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddHttpContextAccessor();

builder.Services.AddScoped<IUserClaimsPrincipalFactory<ApplicationUser>, ApplicationUserClaimsPrincipalFactory>();

builder.Services.AddScoped<ICurrentOrganization, CurrentOrganization>();

builder.Services.AddAuthentication()
    .AddGoogle(options =>
    {
        options.ClientId = builder.Configuration["Authentication:Google:ClientId"]!;
        options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"]!;

        options.CallbackPath = "/signin-google";
    });

builder.Services.AddAuthentication()
    .AddMicrosoftAccount(options =>
    {
        options.ClientId = builder.Configuration["Authentication:Microsoft:ClientId"]!;
        options.ClientSecret = builder.Configuration["Authentication:Microsoft:ClientSecret"]!;

        options.CallbackPath = "/signin-microsoft";
    });

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "__Host-ServiceFlow";
    options.Cookie.HttpOnly = true;
    options.Cookie.Path = "/";
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;

    options.ExpireTimeSpan = TimeSpan.FromHours(8);
    options.SlidingExpiration = true;

    options.Events.OnRedirectToLogin = context =>
    {
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        }

        context.Response.Redirect(context.RedirectUri);
        return Task.CompletedTask;
    };

    options.Events.OnRedirectToAccessDenied = context =>
    {
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        }

        context.Response.Redirect(context.RedirectUri);
        return Task.CompletedTask;
    };
});

builder.Services.Configure<SecurityStampValidatorOptions>(options =>
{
    options.ValidationInterval = TimeSpan.FromMinutes(5);
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    await IdentitySeeder.SeedRolesAsync(scope.ServiceProvider);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    app.MapPost("/development/test-email", async (IEmailSender emailSender, CancellationToken cancellationToken) =>
    {
        await emailSender.SendAsync(
            "developer@serviceflow.local",
            "ServiceFlow email delivery test",
            "<p>If you can read this, local email delivery is working.</p>",
            cancellationToken
        );

        return Results.NoContent();
    })
    .AllowAnonymous()
    .WithTags("Development");
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health").AllowAnonymous();

app.MapControllers();

app.Run();