import { useEffect, useState, type SubmitEvent } from "react";
import { createCustomer, updateCustomer, type Customer, type CustomerInput } from "./customerApi";
import { ApiError, type ValidationErrors } from "../../api/apiClient";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";

type CustomerFormDialogProps = {
    customer: Customer | null,
    onClose: () => void,
    onSaved: (customer: Customer) => void,
    open: boolean
}

function createInitialInput(customer: Customer | null) : CustomerInput {
    return {
        name: customer?.name ?? '',
        contactName: customer?.contactName ?? '',
        email: customer?.email ?? '',
        phoneNumber: customer?.phoneNumber ?? '',
        notes: customer?.notes ?? ''
    }
}

export function CustomerFormDialog({
    customer,
    onClose,
    onSaved,
    open
}: CustomerFormDialogProps) {
    const [input, setInput] = useState<CustomerInput>(createInitialInput(customer));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const isEditing = customer !== null;

    useEffect(() => {
        if (!open) {
            return;
        }

        setInput(createInitialInput(customer));
        setValidationErrors({});
        setErrorMessage(null);
    }, [open, customer]);

    function getFieldError(fieldName: string): string | undefined {
        return validationErrors[fieldName]?.[0];
    }

    function updateField(fieldName: keyof CustomerInput, value: string) {
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
            const savedCustomer = isEditing
                ? await updateCustomer(customer.id, input)
                : await createCustomer(input);

            onSaved(savedCustomer);
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
                setErrorMessage('Unable to save the customer. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
            <Box component='form' onSubmit={e => void handleSubmit(e)}>
                <DialogTitle>
                    {isEditing ? 'Edit customer' : 'New customer'}
                </DialogTitle>

                <DialogContent dividers>
                    <Stack spacing={2}>
                        {errorMessage && (
                            <Alert severity="error">{errorMessage}</Alert>
                        )}

                        <TextField 
                            autoFocus
                            error={Boolean(getFieldError('name'))}
                            fullWidth
                            helperText={getFieldError('name')}
                            slotProps={{ htmlInput: { maxLength: 200 } }}
                            label="Customer name"
                            onChange={e => updateField('name', e.target.value)}
                            required
                            value={input.name}
                        />

                        <TextField 
                            error={Boolean(getFieldError('contactName'))}
                            fullWidth
                            helperText={getFieldError('contactName')}
                            slotProps={{ htmlInput: { maxLength: 200 } }}
                            label="Contact name"
                            onChange={e => updateField('contactName', e.target.value)}
                            value={input.contactName}
                        />

                        <TextField 
                            error={Boolean(getFieldError('email'))}
                            fullWidth
                            helperText={getFieldError('email')}
                            slotProps={{ htmlInput: { maxLength: 256 } }}
                            label="Email"
                            onChange={e => updateField('email', e.target.value)}
                            type="email"
                            value={input.email}
                        />

                        <TextField 
                            error={Boolean(getFieldError('phoneNumber'))}
                            fullWidth
                            helperText={getFieldError('phoneNumber')}
                            slotProps={{ htmlInput: { maxLength: 50 } }}
                            label="Phone number"
                            onChange={e => updateField('phoneNumber', e.target.value)}
                            value={input.phoneNumber}
                        />

                        <TextField 
                            error={Boolean(getFieldError('notes'))}
                            fullWidth
                            helperText={getFieldError('notes')}
                            slotProps={{ htmlInput: { maxLength: 2000 } }}
                            label="Notes"
                            minRows={4}
                            multiline
                            onChange={e => updateField('notes', e.target.value)}
                            value={input.notes}
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
                        {isEditing ? 'Save changes' : 'Create customer'}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}