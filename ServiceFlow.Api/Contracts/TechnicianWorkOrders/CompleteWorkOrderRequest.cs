namespace ServiceFlow.Api.Contracts.TechnicianWorkOrders;

public sealed record CompleteWorkOrderRequest(
    string? CompletionNote
);