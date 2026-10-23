import { useEffect, useState } from "react";
import { deactivateMaterial, type Material } from "./materialsCatalogApi";
import { ApiError } from "../../api/apiClient";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

type MaterialDeactivateDialogProps = {
    material: Material | null,
    onClose: () => void,
    onDeactivated: (materialId: string) => void,
    open: boolean
};

export function MaterialDeactivateDialog({
    material,
    onClose,
    onDeactivated,
    open
}: MaterialDeactivateDialogProps) {
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
        if (!material) {
            return;
        }

        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            await deactivateMaterial(material.id);

            onDeactivated(material.id);
            onClose();
        } catch (error) {
            setErrorMessage(
                error instanceof ApiError
                    ? error.message
                    : 'Unable to deactivate the material. Please try again.'
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog fullWidth maxWidth='sm' onClose={handleClose} open={open}>
            <DialogTitle>
                Deactivate material?
            </DialogTitle>

            <DialogContent>
                <DialogContentText>
                    {material
                        ? `Deactivate ${material.name}? It will no longer be available when technicians record new material usage. Existing Work Order history and cost snapshots will remain unchanged.`
                        : 'Deactivate this material?'}
                </DialogContentText>

                {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button disabled={isSubmitting} onClick={handleClose}>
                    Cancel
                </Button>

                <Button
                    color='warning'
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