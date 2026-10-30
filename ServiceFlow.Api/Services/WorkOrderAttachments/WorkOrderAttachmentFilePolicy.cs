namespace ServiceFlow.Api.Services.WorkOrderAttachments;

public static class WorkOrderAttachmentFilePolicy
{
    public const long MaxFileSizeBytes = 10 * 1024 * 1024;
    public const long MaxMultipartBodySizeBytes = 11 * 1024 * 1024;
    public const int MaxAttachmentsPerWorkOrder = 15;

    private static readonly IReadOnlyDictionary<string, string> ContentTypeByExtension = 
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".png"] = "image/png",
            [".webp"] = "image/webp",
            [".pdf"] = "application/pdf"
        };

    public static bool TryValidate(
        IFormFile? file,
        out ValidatedWorkOrderAttachment? validatedFile,
        out string? errorMessage
    )
    {
        validatedFile = null;
        errorMessage = null;

        if (file is null)
        {
            errorMessage = "An attachment file is required.";
            return false;
        }

        if (file.Length == 0)
        {
            errorMessage = "The attachment file cannot be empty.";
            return false;
        }

        if (file.Length > MaxFileSizeBytes)
        {
            errorMessage = "Attachment files cannot exceed 10 MB.";
            return false;
        }

        var fileName = Path.GetFileName(file.FileName).Trim();

        if (string.IsNullOrWhiteSpace(fileName))
        {
            errorMessage = "The attachment file must have a name.";
            return false;
        }

        if (fileName.Length > 255)
        {
            errorMessage = "Attachment file names cannot exceed 255 characters.";
            return false;
        }

        var extension = Path.GetExtension(fileName);

        if (!ContentTypeByExtension.TryGetValue(extension, out var expectedContentType))
        {
            errorMessage = "Only JPEG, PNG, WebP, and PDF attachments are supported.";
            return false;
        }

        var submittedContentType = file.ContentType
            .Split(';', StringSplitOptions.RemoveEmptyEntries)[0]
            .Trim();

        if (!string.Equals(submittedContentType, expectedContentType, StringComparison.OrdinalIgnoreCase))
        {
            errorMessage = "The attachment file type does not match its extension.";
            return false;
        }

        validatedFile = new ValidatedWorkOrderAttachment(
            fileName,
            extension.ToLowerInvariant(),
            expectedContentType
        );

        return true;
    }

    public sealed record ValidatedWorkOrderAttachment(
        string OriginalFileName,
        string FileExtension,
        string ContentType
    );
}