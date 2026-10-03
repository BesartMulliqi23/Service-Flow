import { useEffect, useState, type SubmitEvent } from "react"
import type { Customer } from "../customers/customerApi"
import type { ServiceLocation, ServiceLocationInput } from "./serviceLocationApi"
import { ApiError, type ValidationErrors } from "../../api/apiClient"
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormHelperText, InputLabel, MenuItem, Select, Stack, TextField } from "@mui/material"

type ServiceLocationFormDialogProps = {
    customers: Customer[],
    onClose: () => void,
    onSaved: (location: ServiceLocation) => void,
    onSubmit: (input: ServiceLocationInput) => Promise<ServiceLocation>,
    open: boolean
}

const initialInput: ServiceLocationInput = {
    customerId: '',
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    country: '',
    accessInstructions: ''
}

export function ServiceLocationFormDialog({
    customers,
    onClose,
    onSaved,
    onSubmit,
    open
}: ServiceLocationFormDialogProps) {
    const [input, setInput] = useState<ServiceLocationInput>(initialInput);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        setInput(initialInput);
        setValidationErrors({});
        setErrorMessage(null);
    }, [open]);

    function getFieldError(fieldName: string): string | undefined {
        return validationErrors[fieldName]?.[0];
    }

    function updateField(fieldName: keyof ServiceLocationInput, value: string) {
        setInput(current => ({
            ...current,
            [fieldName]: value
        }));
    }

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        setIsSubmitting(true);
        setValidationErrors({});
        setErrorMessage(null);

        try {
            const savedLocation = await onSubmit(input);

            onSaved(savedLocation);
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
                setErrorMessage('Unable to save the service location. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
            <Box component="form" onSubmit={e => void handleSubmit(e)}>
                <DialogTitle>New service location</DialogTitle>

                <DialogContent dividers>
                    <Stack spacing={2}>
                        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

                        <FormControl
                            error={Boolean(getFieldError('customerId'))}
                            fullWidth
                            required
                        >
                            <InputLabel id="location-customer-label">Customer</InputLabel>

                            <Select
                                label="Customer"
                                labelId="location-customer-label"
                                onChange={e => updateField('customerId', e.target.value)}
                                value={input.customerId}
                            >
                                {customers.map(c => (
                                    <MenuItem key={c.id} value={c.id}>
                                        {c.name}
                                    </MenuItem>
                                ))}
                            </Select>

                            <FormHelperText>{getFieldError('customerId')}</FormHelperText>
                        </FormControl>

                        <TextField
                            autoFocus
                            error={Boolean(getFieldError('name'))}
                            fullWidth
                            helperText={getFieldError('name')}
                            slotProps={{ htmlInput: { maxLength: 200 } }}
                            label="Location name"
                            onChange={e => updateField('name', e.target.value)}
                            value={input.name}
                            required
                        />

                        <TextField
                            error={Boolean(getFieldError('addressLine1'))}
                            fullWidth
                            helperText={getFieldError('addressLine1')}
                            slotProps={{ htmlInput: { maxLength: 200 } }}
                            label="Address line 1"
                            onChange={e => updateField('addressLine1', e.target.value)}
                            value={input.addressLine1}
                            required
                        />

                        <TextField
                            error={Boolean(getFieldError('addressLine2'))}
                            fullWidth
                            helperText={getFieldError('addressLine2')}
                            slotProps={{ htmlInput: { maxLength: 200 } }}
                            label="Address line 2"
                            onChange={e => updateField('addressLine2', e.target.value)}
                            value={input.addressLine2}
                        />

                        <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                            <TextField
                                error={Boolean(getFieldError('city'))}
                                fullWidth
                                helperText={getFieldError('city')}
                                slotProps={{ htmlInput: { maxLength: 100 } }}
                                label="City"
                                onChange={e => updateField('city', e.target.value)}
                                value={input.city}
                                required
                            />

                            <TextField
                                error={Boolean(getFieldError('postalCode'))}
                                fullWidth
                                helperText={getFieldError('postalCode')}
                                slotProps={{ htmlInput: { maxLength: 20 } }}
                                label="Postal code"
                                onChange={e => updateField('postalCode', e.target.value)}
                                value={input.postalCode}
                            />
                        </Stack>

                        <TextField
                            error={Boolean(getFieldError('country'))}
                            fullWidth
                            helperText={getFieldError('country')}
                            slotProps={{ htmlInput: { maxLength: 100 } }}
                            label="Country"
                            onChange={e => updateField('country', e.target.value)}
                            value={input.country}
                            required
                        />

                        <TextField
                            error={Boolean(getFieldError('accessInstructions'))}
                            fullWidth
                            helperText={getFieldError('accessInstructions')}
                            slotProps={{ htmlInput: { maxLength: 1000 } }}
                            label="Access instructions"
                            minRows={3}
                            multiline
                            onChange={e => updateField('accessInstructions', e.target.value)}
                            value={input.accessInstructions}
                        />
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button disabled={isSubmitting} onClick={onClose}>
                        Cancel
                    </Button>

                    <Button
                        loading={isSubmitting}
                        type="submit"
                        variant="contained"
                    >
                        Create location
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}