import { useEffect, useState } from "react";
import { deactivateCustomer, type Customer } from "./customerApi"
import { ApiError } from "../../api/apiClient";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

type CustomerDeactivateDialogProps = {
    customer: Customer | null,
    onClose: () => void;
    onDeactivated: (customerId: string) => void,
    open: boolean
}

export function CustomerDeactivateDialog({
    customer,
    onClose,
    onDeactivated,
    open
}: CustomerDeactivateDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setErrorMessage(null);
        }
    }, [open]);

    function handleClose() {
        if (!isSubmitting) {
            onClose();
        }
    }

    async function handleDeactivate() {
        if (!customer) return;

        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            await deactivateCustomer(customer.id);

            onDeactivated(customer.id);
            onClose();
        } catch (error) {
            if (error instanceof ApiError) {
                setErrorMessage(error.message);
            }
            else {
                setErrorMessage('Unable to deactivate the customer. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog fullWidth maxWidth="sm" onClose={handleClose} open={open}>
            <DialogTitle>Deactivate customer?</DialogTitle>

            <DialogContent>
                <DialogContentText>
                    {customer
                        ? `Deactivate ${customer.name}? This customer will no longer appear in normal customer lists and cannot be used for new operational work.`
                        : 'Deactivate this customer?'}
                </DialogContentText>

                {errorMessage && <Alert severity="error" sx={{ mt: 2 }}>{errorMessage}</Alert>}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button disabled={isSubmitting} onClick={handleClose}>
                    Cancel
                </Button>

                <Button
                    color="warning"
                    loading={isSubmitting}
                    onClick={() => void handleDeactivate()}
                    variant="contained"
                >
                    Deactivate
                </Button>
            </DialogActions>
        </Dialog>
    );
}