import { useEffect, useState } from "react"
import { deactivateServiceLocation, type ServiceLocation } from "./serviceLocationApi"
import { ApiError } from "../../api/apiClient";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

type ServiceLocationDeactivateDialogProps = {
    location: ServiceLocation | null,
    onClose: () => void,
    onDeactivated: (serviceLocationId: string) => void,
    open: boolean
}

export function ServiceLocationDeactivateDialog({
    location,
    onClose,
    onDeactivated,
    open
}: ServiceLocationDeactivateDialogProps) {
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
        if (!location) {
            return;
        }

        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            await deactivateServiceLocation(location.id);
            
            onDeactivated(location.id);
            onClose();
        } catch (error) {
            if (error instanceof ApiError) {
                setErrorMessage(error.message);
            }
            else {
                setErrorMessage('Unable to deactivate the service location. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog fullWidth maxWidth="xs" onClose={handleClose} open={open}>
            <DialogTitle>Deactivate service location</DialogTitle>

            <DialogContent>
                <DialogContentText>
                    {location
                        ? `Deactivate ${location.name}? It will no longer be available for new work orders, but existing historical data will remain intact.`
                        : 'Deactivate this service location?'}
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