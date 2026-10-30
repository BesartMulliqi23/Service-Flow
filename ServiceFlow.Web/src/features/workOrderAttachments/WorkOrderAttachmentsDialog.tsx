import { useEffect, useState } from "react";
import type { WorkOrder } from "../workOrders/workOrderApi";
import { getWorkOrderAttachmentDownloadUrl, getWorkOrderAttachments, type WorkOrderAttachment } from "./workOrderAttachmentsApi";
import { ApiError } from "../../api/apiClient";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { WorkOrderAttachmentList } from "./WorkOrderAttachmentList";

type WorkOrderAttachmentsDialogProps = {
    onClose: () => void,
    open: boolean,
    workOrder: WorkOrder | null
};

export function WorkOrderAttachmentsDialog({
    onClose,
    open,
    workOrder
}: WorkOrderAttachmentsDialogProps) {
    const [attachments, setAttachments] = useState<WorkOrderAttachment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !workOrder) return;

        let isCurrentRequest = true;
        const currentWorkOrder = workOrder;

        async function loadAttachments() {
            setIsLoading(true);
            setErrorMessage(null);

            try {
                const response = await getWorkOrderAttachments(currentWorkOrder.id);

                if (isCurrentRequest) {
                    setAttachments(response);
                }
            } catch (error) {
                if (!isCurrentRequest) return;

                setErrorMessage(
                    error instanceof ApiError
                        ? error.message
                        : 'Unable to load Work Order attachments. Please try again in a moment.'
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
    }, [workOrder, open]);

    return (
        <Dialog fullWidth maxWidth='sm' onClose={onClose} open={open}>
            <DialogTitle>
                Photos and attachments{workOrder ? ` — ${workOrder.title}` : ""}
            </DialogTitle>

            <DialogContent dividers>
                {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

                {!workOrder ? null : isLoading ? (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            py: 3
                        }}
                    >
                        <CircularProgress aria-label="Loading Work Order attachments" />
                    </Box>
                ) : !errorMessage ? (
                    <WorkOrderAttachmentList
                        attachments={attachments}
                        emptyMessage="No photos or attachments were recorded for this Work Order."
                        getDownloadUrl={attachmentId =>
                            getWorkOrderAttachmentDownloadUrl(
                                workOrder.id,
                                attachmentId
                            )
                        }
                    />
                ) : null}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}