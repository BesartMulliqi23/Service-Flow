using Microsoft.AspNetCore.Identity;

namespace ServiceFlow.Api.Models;

public sealed class ApplicationUser : IdentityUser
{
    public string DisplayName { get; set; } = string.Empty;
}