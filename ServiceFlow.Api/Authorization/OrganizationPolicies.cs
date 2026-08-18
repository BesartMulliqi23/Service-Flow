using ServiceFlow.Api.Models;

namespace ServiceFlow.Api.Authorization;

public static class OrganizationPolicies
{
    public const string ManageMembers = "organization.manage-members";
    public const string ManageCustomers = "organization.manage-customers";
    public const string ManageWorkOrders = "organization.manage-work-orders";
    public const string ViewReports = "organization.view-reports";
    public const string ViewWorkOrders = "organization.view-work-orders";
    public const string ExecuteAssignedWork = "organization.execute-assigned-work";

    public static readonly string[] OperationsManagers = [
        ApplicationRoles.Owner,
        ApplicationRoles.Manager,
        ApplicationRoles.Dispatcher
    ];

    public static readonly string[] AllOrganizationRoles = [
        ApplicationRoles.Owner,
        ApplicationRoles.Manager,
        ApplicationRoles.Dispatcher,
        ApplicationRoles.Technician
    ];
}