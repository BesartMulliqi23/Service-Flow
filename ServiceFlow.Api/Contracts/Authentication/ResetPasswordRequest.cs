namespace ServiceFlow.Api.Contracts.Authentication;

public sealed record ResetPasswordRequest(
    string? UserId,
    string? Token,
    string? NewPassword,
    string? ConfirmPassword
);