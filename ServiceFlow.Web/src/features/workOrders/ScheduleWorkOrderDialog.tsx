import { useEffect, useState, type SubmitEvent } from "react";
import { scheduleWorkOrder, type WorkOrder } from "./workOrderApi";
import { ApiError, type ValidationErrors } from "../../api/apiClient";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";

type ScheduleWorkOrderDialogProps = {
    onClose: () => void,
    onScheduled: (workOrder: WorkOrder) => void,
    open: boolean,
    workOrder: WorkOrder | null
};

type ScheduleFormValues = {
    scheduledStart: string,
    scheduledEnd: string
};

function formatDateTimeForInput(value: string | null) {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');

    return `${y}-${m}-${d}T${h}:${min}`;
}

function createInitialValues(workOrder: WorkOrder | null): ScheduleFormValues {
    return {
        scheduledStart: formatDateTimeForInput(workOrder?.scheduledStartUtc ?? null),
        scheduledEnd: formatDateTimeForInput(workOrder?.scheduledEndUtc ?? null)
    };
}

export function ScheduleWorkOrderDialog({
    onClose,
    onScheduled,
    open,
    workOrder
}: ScheduleWorkOrderDialogProps) {
    const [values, setValues] = useState<ScheduleFormValues>(createInitialValues(workOrder));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const isRescheduling = workOrder?.status === 'Scheduled';

    useEffect(() => {
        if (!open) {
            return;
        }

        setValues(createInitialValues(workOrder));
        setValidationErrors({});
        setErrorMessage(null);
    }, [open, workOrder]);

    function getFieldError(fieldName: string): string | undefined {
        return validationErrors[fieldName]?.[0];
    }

    function updateField(fieldName: keyof ScheduleFormValues, value: string) {
        setValues(current => ({
            ...current,
            [fieldName]: value
        }));
    }

    function handleClose() {
        if (!isSubmitting) {
            onClose();
        }
    }

    function validateInput(): ValidationErrors {
        const errors: ValidationErrors = {};

        if (!values.scheduledStart) {
            errors.scheduledStartUtc = ['A scheduled start time is required.'];
        }

        if (!values.scheduledEnd) {
            errors.scheduledEndUtc = ['A scheduled end time is required.'];
        }

        if (values.scheduledStart && values.scheduledEnd &&
            new Date(values.scheduledStart) >= new Date(values.scheduledEnd)
        ) {
            errors.scheduledEndUtc = ['Scheduled end time must be later than scheduled start time.'];
        }

        return errors;
    }

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const errors = validateInput();

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        if (!workOrder) {
            return;
        }

        setIsSubmitting(true);
        setValidationErrors({});
        setErrorMessage(null);

        try {
            const scheduledWorkOrder = await scheduleWorkOrder(workOrder.id, {
                scheduledStartUtc: new Date(values.scheduledStart).toISOString(),
                scheduledEndUtc: new Date(values.scheduledEnd).toISOString()
            });

            console.log('Scheduled work order returned from API:', scheduledWorkOrder);
            console.log('Returned scheduledStartUtc:', scheduledWorkOrder.scheduledStartUtc);
            console.log('Returned scheduledEndUtc:', scheduledWorkOrder.scheduledEndUtc);

            onScheduled(scheduledWorkOrder);
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
                setErrorMessage('Unable to schedule the Work Order. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog fullWidth maxWidth='sm' onClose={handleClose} open={open}>
            <Box component='form' onSubmit={e => void handleSubmit(e)}>
                <DialogTitle>
                    {isRescheduling ? 'Reschedule work order' : 'Schedule work order'}
                </DialogTitle>

                <DialogContent dividers>
                    <Stack spacing={2}>
                        {errorMessage && <Alert severity='error'>{errorMessage}</Alert>}

                        <TextField
                            error={Boolean(getFieldError('scheduledStartUtc'))}
                            helperText={getFieldError('scheduledStartUtc')}
                            fullWidth
                            label="Scheduled start"
                            onChange={e => updateField('scheduledStart', e.target.value)}
                            value={values.scheduledStart}
                            slotProps={{ inputLabel: { shrink: true } }}
                            required
                            type="datetime-local"
                        />

                        <TextField
                            error={Boolean(getFieldError('scheduledEndUtc'))}
                            helperText={getFieldError('scheduledEndUtc')}
                            fullWidth
                            label="Scheduled end"
                            onChange={e => updateField('scheduledEnd', e.target.value)}
                            value={values.scheduledEnd}
                            slotProps={{ inputLabel: { shrink: true } }}
                            required
                            type="datetime-local"
                        />
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button disabled={isSubmitting} onClick={handleClose}>
                        Cancel
                    </Button>

                    <Button
                        loading={isSubmitting}
                        type="submit"
                        variant="contained"
                    >
                        {isRescheduling ? 'Save schedule' : 'Schedule work order'}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}