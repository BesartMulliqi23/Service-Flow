import { useEffect, useState } from "react";
import type { WorkOrder } from "../workOrders/workOrderApi";
import { getWorkOrderNotes, type WorkOrderNote } from "./workOrderNotesApi";
import { ApiError } from "../../api/apiClient";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { WorkOrderNotesTimeline } from "./WorkOrderNotesSection";

type WorkOrderNotesDialogProps = {
    onClose: () => void,
    open: boolean,
    workOrder: WorkOrder | null
};

export function WorkOrderNotesDialog({
    onClose,
    open,
    workOrder
}: WorkOrderNotesDialogProps) {
    const [notes, setNotes] = useState<WorkOrderNote[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !workOrder) {
            return;
        }

        let isCurrentRequest = true;

        const currentWorkOrder = workOrder;

        async function loadNotes() {
            setIsLoading(true);
            setErrorMessage(null); 

            try {
                const response = await getWorkOrderNotes(currentWorkOrder.id);

                if (isCurrentRequest) {
                    setNotes(response);
                }
            } catch (error) {
                if (!isCurrentRequest) return;

                setErrorMessage(
                    error instanceof ApiError
                        ? error.message
                        : 'Unable to load Work Order notes. Please try again in a moment.'
                );
            } finally {
                if (isCurrentRequest) {
                    setIsLoading(false);
                }
            }
        }

        void loadNotes();

        return () => {
            isCurrentRequest = false;
        };
    }, [open, workOrder]);

    return (
        <Dialog fullWidth maxWidth='sm' onClose={onClose} open={open}>
            <DialogTitle>
                Job notes{workOrder ? ` — ${workOrder.title}` : ''}
            </DialogTitle>

            <DialogContent dividers>
                {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

                {isLoading ? (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            py: 3
                        }}
                    >
                        <CircularProgress aria-label="Loading Work Order notes" />
                    </Box>
                ) : !errorMessage ? (
                    <WorkOrderNotesTimeline
                        emptyMessage="No job notes have been recorded for this Work Order."
                        notes={notes}
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