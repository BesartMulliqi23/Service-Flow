namespace ServiceFlow.Api.Models;

public static class ApplicationRoles
{
    public const string Owner = "Owner";
    public const string Dispatcher = "Dispatcher";
    public const string Technician = "Technician";
    public const string Manager = "Manager";

    public static readonly IReadOnlyCollection<string> All = [
        Owner,
        Dispatcher,
        Technician,
        Manager
    ];
}