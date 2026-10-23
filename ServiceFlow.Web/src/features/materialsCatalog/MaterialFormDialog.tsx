import { useEffect, useState, type SubmitEvent } from "react";
import { createMaterial, updateMaterial, type Material, type MaterialInput } from "./materialsCatalogApi";
import { ApiError, type ValidationErrors } from "../../api/apiClient";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";

type MaterialFormValues = {
    name: string,
    sku: string,
    unitOfMeasure: string,
    defaultUnitCost: string
};

type MaterialFormDialogProps = {
    material: Material | null,
    onClose: () => void,
    onSaved: (material: Material) => void,
    open: boolean
};

function createInitialValues(material: Material | null): MaterialFormValues {
    return {
        name: material?.name ?? '',
        sku: material?.sku ?? '',
        unitOfMeasure: material?.unitOfMeasure ?? '',
        defaultUnitCost: material ? String(material.defaultUnitCost) : ''
    };
}

export function MaterialFormDialog({
    material,
    onClose,
    onSaved,
    open
}: MaterialFormDialogProps) {
    const [values, setValues] = useState<MaterialFormValues>(createInitialValues(material));
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEditing = material !== null;

    useEffect(() => {
        if (!open) {
            return;
        }

        setValues(createInitialValues(material));
        setValidationErrors({});
        setErrorMessage(null);
    }, [material, open]);

    function updateField(field: keyof MaterialFormValues, value: string) {
        setValues(current => ({
            ...current,
            [field]: value
        }));
    }

    function getFieldError(field: string) {
        return validationErrors[field]?.[0];
    }

    function validateInput(): ValidationErrors {
        const errors: ValidationErrors = {};

        if (!values.name.trim()) {
            errors.name = ['A material name is required.'];
        }

        if (!values.unitOfMeasure.trim()) {
            errors.unitOfMeasure = ['A unit of measure is required.'];
        }

        const defaultUnitCost = Number(values.defaultUnitCost);

        if (!values.defaultUnitCost.trim() || !Number.isFinite(defaultUnitCost) || defaultUnitCost < 0) {
            errors.defaultUnitCost = ['A default unit cost of zero or greater is required.'];
        }

        return errors;
    }

    function handleClose() {
        if (!isSubmitting) {
            onClose();
        }
    }

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const clientValidationErrors = validateInput();

        if (Object.keys(clientValidationErrors).length > 0) {
            setValidationErrors(clientValidationErrors);
            return;
        }

        setIsSubmitting(true);
        setValidationErrors({});
        setErrorMessage(null);

        const input: MaterialInput = {
            name: values.name.trim(),
            sku: values.sku.trim(),
            unitOfMeasure: values.unitOfMeasure.trim(),
            defaultUnitCost: Number(values.defaultUnitCost)
        };

        try {
            const savedMaterial = material
                ? await updateMaterial(material.id, input)
                : await createMaterial(input); 

            onSaved(savedMaterial);
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
                setErrorMessage('Unable to save the material. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog fullWidth maxWidth='sm' onClose={handleClose} open={open}>
            <Box component='form' onSubmit={e => void handleSubmit(e)}>
                <DialogTitle>
                    {isEditing ? 'Edit material' : 'New material'}
                </DialogTitle>

                <DialogContent dividers>
                    <Stack spacing={2}>
                        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

                        <TextField
                            autoFocus
                            error={Boolean(getFieldError('name'))}
                            helperText={getFieldError('name')}
                            fullWidth
                            label='Material name'
                            onChange={e => updateField('name', e.target.value)}
                            value={values.name}
                            required
                            slotProps={{ htmlInput: { maxLength: 200 } }}
                        />

                        <TextField
                            error={Boolean(getFieldError('sku'))}
                            helperText={getFieldError('sku') ?? 'Optional identifier used to distinguish this material.'}
                            fullWidth
                            label='SKU'
                            onChange={e => updateField('sku', e.target.value)}
                            value={values.sku}
                            slotProps={{ htmlInput: { maxLength: 100 } }}
                        />

                        <TextField
                            error={Boolean(getFieldError('unitOfMeasure'))}
                            helperText={getFieldError('unitOfMeasure') ?? 'For example: each, box, meter, litre, or kilogram.'}
                            fullWidth
                            label='Unit of measure'
                            onChange={e => updateField('unitOfMeasure', e.target.value)}
                            value={values.unitOfMeasure}
                            required
                            slotProps={{ htmlInput: { maxLength: 30 } }}
                        />

                        <TextField
                            error={Boolean(getFieldError('defaultUnitCost'))}
                            helperText={getFieldError('defaultUnitCost') ?? 'Used as the default when a technician records material usage.'}
                            fullWidth
                            label='Default unit cost'
                            onChange={e => updateField('defaultUnitCost', e.target.value)}
                            value={values.defaultUnitCost}
                            required
                            type="number"
                            slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
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
                        {isEditing ? 'Save changes' : 'Create material'}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}