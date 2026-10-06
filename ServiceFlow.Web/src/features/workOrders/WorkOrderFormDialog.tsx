import { useEffect, useState, type SubmitEvent } from "react";
import type { ServiceLocation } from "../serviceLocations/serviceLocationApi"
import type { WorkOrder, WorkOrderInput, WorkOrderPriority } from "./workOrderApi"
import { ApiError, type ValidationErrors } from "../../api/apiClient";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormHelperText, InputLabel, MenuItem, Select, Stack, TextField } from "@mui/material";

type WorkOrderFormDialogProps = {
    serviceLocations: ServiceLocation[],
    workOrder: WorkOrder | null,
    onClose: () => void,
    onSaved: (workOrder: WorkOrder) => void,
    onSubmit: (input: WorkOrderInput) => Promise<WorkOrder>,
    open: boolean
};

type WorkOrderFormValues = {
    serviceLocationId: string,
    title: string,
    description: string,
    priority: WorkOrderPriority,
    dueDate: string
};

const priorities: WorkOrderPriority[] = ['Low', 'Normal', 'High', 'Urgent'];

function formatDateForInput(value: string | null) {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;
}

function createInitialValues(workOrder: WorkOrder | null): WorkOrderFormValues {
    return {
        serviceLocationId: workOrder?.serviceLocationId ?? '',
        title: workOrder?.title ?? '',
        description: workOrder?.description ?? '',
        priority: workOrder?.priority ?? 'Normal',
        dueDate: formatDateForInput(workOrder?.dueUtc ?? null)
    };
}

function toWorkOrderInput(values: WorkOrderFormValues): WorkOrderInput {
    return {
        serviceLocationId: values.serviceLocationId,
        title: values.title,
        description: values.description,
        priority: values.priority,
        dueUtc: values.dueDate ? new Date(`${values.dueDate}T00:00:00`).toISOString() : null
    };
}

export function WorkOrderFormDialog({
    serviceLocations,
    workOrder,
    onClose,
    onSaved,
    onSubmit,
    open
}: WorkOrderFormDialogProps) {
    const [values, setValues] = useState<WorkOrderFormValues>(createInitialValues(workOrder));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const isEditing = workOrder !== null;

    useEffect(() => {
        if (!open) {
            return;
        }

        setValues(createInitialValues(workOrder));
        setValidationErrors({});
        setErrorMessage(null);
    }, [open, workOrder]);

    function getFieldErrors(fieldName: string): string | undefined {
        return validationErrors[fieldName]?.[0];
    }

    function updateField(fieldName: keyof WorkOrderFormValues, value: string) {
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

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        setIsSubmitting(true);
        setValidationErrors({});
        setErrorMessage(null);

        try {
            const savedWorkOrder = await onSubmit(toWorkOrderInput(values));
            
            onSaved(savedWorkOrder);
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
                setErrorMessage('Unable to save the work order. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog fullWidth maxWidth="sm" onClose={handleClose} open={open}>
            <Box component='form' onSubmit={e => void handleSubmit(e)}>
                <DialogTitle>
                    {isEditing ? 'Edit draft work order' : 'New work order'}
                </DialogTitle>

                <DialogContent dividers>
                    <Stack spacing={2}>
                        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

                        <FormControl
                            disabled={isEditing}
                            error={Boolean(getFieldErrors('serviceLocationId'))}
                            fullWidth
                            required
                        >
                            <InputLabel id="work-order-location-label">
                                Service location
                            </InputLabel>

                            <Select
                                label="Service location"
                                labelId="work-order-location-label"
                                onChange={e => updateField('serviceLocationId', e.target.value)}
                                value={values.serviceLocationId}
                            >
                                {serviceLocations.filter(location => 
                                    location.isActive || location.id === workOrder?.serviceLocationId
                                ).map(location => (
                                    <MenuItem key={location.id} value={location.id}>
                                        {location.customerName} —{' '}{location.name}
                                    </MenuItem>
                                ))}
                            </Select>

                            <FormHelperText>
                                {isEditing
                                    ? 'A Work Order cannot be moved to another service location.'
                                    : getFieldErrors('serviceLocationId')}
                            </FormHelperText>
                        </FormControl>

                        <TextField 
                            autoFocus
                            error={Boolean(getFieldErrors('title'))}
                            helperText={getFieldErrors('title')}
                            fullWidth
                            label="Title"
                            onChange={e => updateField('title', e.target.value)}
                            value={values.title}
                            slotProps={{ htmlInput: { maxLength: 200 } }}
                            required
                        />

                        <TextField 
                            error={Boolean(getFieldErrors('description'))}
                            helperText={getFieldErrors('description')}
                            fullWidth
                            label="Description"
                            minRows={5}
                            multiline
                            onChange={e => updateField('description', e.target.value)}
                            value={values.description}
                            slotProps={{ htmlInput: { maxLength: 4000 } }}
                            required
                        />

                        <FormControl
                            error={Boolean(getFieldErrors('priority'))}
                            fullWidth
                            required
                        >
                            <InputLabel id="work-order-priority-label">
                                Priority
                            </InputLabel>

                            <Select
                                label="Priority"
                                labelId="work-order-priority-label"
                                onChange={e => updateField('priority', e.target.value)}
                                value={values.priority}
                            >
                                {priorities.map(p => (
                                    <MenuItem key={p} value={p}>
                                        {p}
                                    </MenuItem>
                                ))}
                            </Select>

                            <FormHelperText>
                                {getFieldErrors('priority')}
                            </FormHelperText>
                        </FormControl>

                        <TextField 
                            fullWidth
                            label="Due date"
                            onChange={e => updateField('dueDate', e.target.value)}
                            value={values.dueDate}
                            slotProps={{ inputLabel: { shrink: true } }}
                            type="date"
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
                        {isEditing ? 'Save changes' : 'Create work order'}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}