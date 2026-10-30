import { DescriptionRounded, ImageRounded, OpenInNewRounded } from "@mui/icons-material";
import type { WorkOrderAttachment } from "./workOrderAttachmentsApi";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";

type WorkOrderAttachmentListProps = {
    attachments: WorkOrderAttachment[],
    emptyMessage: string,
    getDownloadUrl: (attachmentId: string) => string
};

function formatFileSize(fileSizeBytes: number) {
    if (fileSizeBytes < 1024 * 1024) {
        return `${Math.ceil(fileSizeBytes / 1024)} KB`
    }

    return `${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatTimestamp(value: string) {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(new Date(value));
}

function getAttachmentIcon(contentType: string) {
    return contentType.startsWith('image/')
        ? <ImageRounded color="primary" />
        : <DescriptionRounded color="primary" />
}

export function WorkOrderAttachmentList({
    attachments,
    emptyMessage,
    getDownloadUrl
}: WorkOrderAttachmentListProps) {
    if (attachments.length === 0) {
        return (
            <Typography color="text.secondary">
                {emptyMessage}
            </Typography>
        );
    }

    return (
        <Stack spacing={1}>
            {attachments.map(attachment => (
                <Paper
                    key={attachment.id}
                    sx={{
                        alignItems: 'center',
                        display: 'flex',
                        gap: 1.5,
                        justifyContent: 'space-between',
                        p: 1.5
                    }}
                    variant="outlined"
                >
                    <Stack
                        direction='row'
                        spacing={1.5}
                        sx={{ alignItems: 'center', minWidth: 0 }}
                    >
                        {getAttachmentIcon(attachment.contentType)}

                        <Box sx={{ minWidth: 0 }}>
                            <Typography noWrap sx={{ fontWeight: 600 }}>
                                {attachment.originalFileName}
                            </Typography>

                            <Typography color="text.secondary" variant="body2">
                                {formatFileSize(attachment.fileSizeBytes)}
                                {" · "}
                                {attachment.uploadedByDisplayName}
                                {" · "}
                                {formatTimestamp(attachment.createdUtc)}
                            </Typography>
                        </Box>
                    </Stack>

                    <Button
                        component="a"
                        href={getDownloadUrl(attachment.id)}
                        rel="noreferrer"
                        size="small"
                        startIcon={<OpenInNewRounded />}
                        target="_blank"
                        variant="text"
                    >
                        Open
                    </Button>
                </Paper>
            ))}
        </Stack>
    );
}