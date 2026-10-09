import { useEffect, useState, type SubmitEvent } from "react";
import { completeTechnicianWorkOrder, type TechnicianWorkOrder } from "./technicianWorkOrderApi";
import { ApiError, type ValidationErrors } from "../../api/apiClient";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";

type CompleteWorkOrderDialogProps = {
    onClose: () => void,
    onCompleted: (workOrder: TechnicianWorkOrder) => void,
    open: boolean,
    workOrder: TechnicianWorkOrder | null
};

export function CompleteWorkOrderDialog({
    onClose,
    onCompleted,
    open,
    workOrder
}: CompleteWorkOrderDialogProps) {
    const [completionNote, setCompletionNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setCompletionNote('');
            setValidationErrors({});
            setErrorMessage(null);
        }
    }, [open]);

    function getFieldError(fieldName: string): string | undefined {
        return validationErrors[fieldName]?.[0];
    }

    function handleClose() {
        if (!isSubmitting) {
            onClose();
        }
    }

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!completionNote.trim()) {
            setValidationErrors({
                completionNote: ['A completion note is required.'],
            });

            return;
        }

        if (!workOrder) {
            return;
        }

        setIsSubmitting(true);
        setValidationErrors({});
        setErrorMessage(null);

        try {
            const completedWorkOrder = await completeTechnicianWorkOrder(workOrder.id, completionNote);

            onCompleted(completedWorkOrder);
            onClose();
        } catch (error) {
            if (error instanceof ApiError) {
                if (error.validationErrors) {
                    setValidationErrors(error.validationErrors);
                }
                else {
                    setErrorMessage(error.message);
                }
            }
            else {
                setErrorMessage('Unable to complete the Work Order. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog fullWidth maxWidth='sm' onClose={handleClose} open={open}>
            <Box component='form' onSubmit={e => void handleSubmit(e)}>
                <DialogTitle>Complete work order</DialogTitle>

                <DialogContent dividers>
                    <Stack spacing={2}>
                        {errorMessage && <Alert severity='error'>{errorMessage}</Alert>}

                        <TextField
                            autoFocus
                            error={Boolean(getFieldError('completionNote'))}
                            helperText={
                                getFieldError('completionNote') ?? 
                                'Describe the completed work, outcome, or any relevant follow-up.'
                            }
                            minRows={5}
                            multiline
                            onChange={e => setCompletionNote(e.target.value)}
                            value={completionNote}
                            slotProps={{ htmlInput: { maxLength: 4000 } }}
                            required
                        />
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button disabled={isSubmitting} onClick={handleClose}>
                        Cancel
                    </Button>

                    <Button
                        color='success'
                        loading={isSubmitting}
                        type='submit'
                        variant='contained'
                    >
                        Complete work order
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}