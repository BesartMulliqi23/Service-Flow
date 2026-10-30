import { UploadFileRounded } from "@mui/icons-material";
import { useEffect, useState, type ChangeEvent } from "react";
import { getTechnicianAttachmentDownloadUrl, getTechnicianWorkOrderAttachments, uploadTechnicianWorkOrderAttachment, type WorkOrderAttachment } from "./workOrderAttachmentsApi";
import { ApiError } from "../../api/apiClient";
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { WorkOrderAttachmentList } from "./WorkOrderAttachmentList";

type WorkOrderAttachmentsSectionProps = {
    canUpload: boolean,
    description: string,
    emptyMessage: string,
    workOrderId: string
};

const maxFileSizeBytes = 10 * 1024 * 1024;

const supportedContentTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf"
]);

export function WorkOrderAttachmentsSection({
    canUpload,
    description,
    emptyMessage,
    workOrderId
}: WorkOrderAttachmentsSectionProps) {
    const [attachments, setAttachments] = useState<WorkOrderAttachment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        let isCurrentRequest = true;

        async function loadAttachments() {
            setIsLoading(true);
            setErrorMessage(null);

            try {
                const response = await getTechnicianWorkOrderAttachments(workOrderId);

                if (isCurrentRequest) {
                    setAttachments(response);
                }
            } catch (error) {
                if (!isCurrentRequest) return;

                setErrorMessage(
                    error instanceof ApiError
                        ? error.message
                        : 'Unable to load job attachments. Please try again in a moment.'
                );
            } finally {
                if (isCurrentRequest) {
                    setIsLoading(false);
                }
            }
        }

        void loadAttachments();

        return () => {
            isCurrentRequest = false;
        };
    }, [workOrderId]);

    async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];

        // Allows selecting the same file again after a failed upload.
        event.target.value = '';

        if (!file) return;

        if (file.size > maxFileSizeBytes) {
            setErrorMessage('Attachment files cannot exceed 10 MB.');
            return;
        }

        if (!supportedContentTypes.has(file.type)) {
            setErrorMessage('Only JPEG, PNG, WebP, and PDF attachments are supported.');
            return;
        }

        setIsUploading(true);
        setErrorMessage(null);

        try {
            const uploadedAttachment = await uploadTechnicianWorkOrderAttachment(workOrderId, file);

            setAttachments(current => [
                uploadedAttachment,
                ...current
            ]);
        } catch (error) {
            setErrorMessage(
                error instanceof ApiError
                ? error.message
                : 'Unable to upload the attachment. Please try again.'
            );
        } finally {
            setIsUploading(false);
        }
    }

    return (
        <Paper sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2}>
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    sx={{
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        justifyContent: 'space-between'
                    }}
                >
                    <Stack spacing={0.5}>
                        <Typography component='h2' variant="h6" sx={{ fontWeight: 700 }}>
                            Photos and attachments
                        </Typography>

                        <Typography color='text.secondary' variant="body2">
                            {description}
                        </Typography>
                    </Stack>

                    {canUpload && (
                        <Button
                            component="label"
                            disabled={isUploading}
                            loading={isUploading}
                            startIcon={<UploadFileRounded />}
                            variant="outlined"
                        >
                            Upload attachment

                            <input
                                accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                                hidden
                                onChange={e => void handleFileChange(e)}
                                type="file"
                            />
                        </Button>
                    )}
                </Stack>

                {canUpload && (
                    <Typography variant="caption" color="text.secondary">
                        JPEG, PNG, WebP, or PDF · maximum 10 MB · up to 15 attachments
                    </Typography>
                )}

                {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

                {isLoading ? (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            py: 3
                        }}
                    >
                        <CircularProgress aria-label="Loading attachments" />
                    </Box>
                ) : <WorkOrderAttachmentList
                        attachments={attachments}
                        emptyMessage={emptyMessage}
                        getDownloadUrl={attachemntId => getTechnicianAttachmentDownloadUrl(workOrderId, attachemntId)}
                    />
                }
            </Stack>
        </Paper>
    );
}