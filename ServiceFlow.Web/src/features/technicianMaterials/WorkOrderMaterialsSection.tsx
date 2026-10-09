import { useEffect, useMemo, useState, type SubmitEvent } from "react";
import { addWorkOrderMaterial, getTechnicianMaterials, getWorkOrderMaterials, removeWorkOrderMaterial, updateWorkOrderMaterial, type TechnicianMaterial, type WorkOrderMaterialUsage } from "./technicianMaterialsApi";
import { ApiError, type ValidationErrors } from "../../api/apiClient";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormHelperText, IconButton, InputLabel, MenuItem, Paper, Select, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { AddRounded, DeleteOutlineRounded, EditRounded } from "@mui/icons-material";

type WorkOrderMaterialsSectionProps = {
    canEdit: boolean,
    workOrderId: string
};

type MaterialFormValues = {
    materialId: string,
    quantity: string,
    unitCost: string
};

function createInitialValues(usage: WorkOrderMaterialUsage | null): MaterialFormValues {
    return {
        materialId: usage?.materialId ?? '',
        quantity: usage ? String(usage.quantity) : '',
        unitCost: usage ? String(usage.unitCost) : ''
    };
}

function formatDecimal(value: number) {
    return value.toFixed(2);
}

export function WorkOrderMaterialsSection({
    canEdit,
    workOrderId
}: WorkOrderMaterialsSectionProps) {
    const [materials, setMaterials] = useState<TechnicianMaterial[]>([]);
    const [usages, setUsages] = useState<WorkOrderMaterialUsage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedUsage, setSelectedUsage] = useState<WorkOrderMaterialUsage | null>(null);

    useEffect(() => {
        let isCurrentRequest = true;

        async function loadData() {
            setIsLoading(true);
            setErrorMessage(null);

            try {
                const requests: [
                    Promise<WorkOrderMaterialUsage[]>,
                    Promise<TechnicianMaterial[]>?
                ] = [
                    getWorkOrderMaterials(workOrderId)
                ]

                if (canEdit) {
                    requests.push(getTechnicianMaterials());
                }

                const [usageResponse, materialResponse] = await Promise.all(requests);

                if (isCurrentRequest) {
                    setUsages(usageResponse);
                    setMaterials(materialResponse ?? []);
                }
            } catch (error) {
                if (!isCurrentRequest) {
                    return;
                }

                if (error instanceof ApiError) {
                    setErrorMessage(error.message);
                }
                else {
                    setErrorMessage('Unable to load material usage. Please try again.');
                }
            } finally {
                if (isCurrentRequest) {
                    setIsLoading(false);
                }
            }
        }

        void loadData();

        return () => {
            isCurrentRequest = false;
        };
    }, [canEdit, workOrderId]);

    const totalCost = useMemo(
        () => usages.reduce((total, usage) => total + usage.lineTotal, 0),
        [usages]
    );

    function openAddDialog() {
        setSelectedUsage(null);
        setIsFormOpen(true);
    }

    function openEditDialog(usage: WorkOrderMaterialUsage) {
        setSelectedUsage(usage);
        setIsFormOpen(true);
    }

    function handleSavedUsage(savedUsage: WorkOrderMaterialUsage) {
        setUsages(current => {
            const exists = current.some(usage => usage.id === savedUsage.id);

            if (!exists) {
                return [...current, savedUsage];
            }

            return current.map(
                usage => usage.id === savedUsage.id ? savedUsage : usage
            );
        });
    }

    async function handleRemove(usage: WorkOrderMaterialUsage) {
        const shouldRemove = window.confirm(`Remove ${usage.materialName} from this job? `);

        if (!shouldRemove) {
            return;
        }

        setErrorMessage(null);

        try {
            await removeWorkOrderMaterial(workOrderId, usage.id);

            setUsages(current => current.filter(u => u.id !== usage.id));
        } catch (error) {
            if (error instanceof ApiError) {
                setErrorMessage(error.message);
            }
            else {
                setErrorMessage('Unable to remove the material usage. Please try again.');
            }
        }
    }

    return (
        <>
            <Paper sx={{ p: { xs: 2, md: 3 } }}>
                <Stack spacing={2}>
                    <Stack
                        spacing={1}
                        direction={{ xs: 'column', sm: 'row' }}
                        sx={{
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            justifyContent: 'space-between'
                        }}
                    >
                        <Box>
                            <Typography
                                component='h2'
                                variant='h6'
                                sx={{ fontWeight: 700 }}
                            >
                                Materials used
                            </Typography>

                            <Typography color='text.secondary' variant="body2">
                                Record materials consumed while completing this job.
                            </Typography>
                        </Box>

                        {canEdit && (
                            <Button
                                onClick={openAddDialog}
                                startIcon={<AddRounded />}
                                variant="outlined"
                            >
                                Add material
                            </Button>
                        )}
                    </Stack>

                    {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

                    {isLoading ? (
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                py: 3
                            }}
                        >
                            <CircularProgress aria-label="Loading materials" />
                        </Box>
                    ) : usages.length === 0 ? (
                        <Typography color='text.secondary'>
                            No materials have been recorded for this job.
                        </Typography>
                    ) : (
                        <>
                            <Stack spacing={1}>
                                {usages.map(usage => (
                                    <Paper 
                                        key={usage.id}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            p: 1.5
                                        }}
                                    >
                                        <Box>
                                            <Typography sx={{ fontWeight: 600 }}>
                                                {usage.materialName}
                                            </Typography>

                                            <Typography color='text.secondary' variant="body2">
                                                {formatDecimal(usage.quantity)}{' '}
                                                {usage.unitOfMeasure} ×{' '}
                                                {formatDecimal(usage.unitCost)} ={' '}
                                                {formatDecimal(usage.lineTotal)}
                                            </Typography>
                                        </Box>

                                        {canEdit && (
                                            <Stack direction='row' spacing={0.5}>
                                                <Tooltip title='Edit material usage'>
                                                    <IconButton
                                                        aria-label={`Edit ${usage.materialName}`}
                                                        onClick={() => openEditDialog(usage)}
                                                    >
                                                        <EditRounded />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title='Remove material usage'>
                                                    <IconButton
                                                        aria-label={`Remove ${usage.materialName}`}
                                                        color='warning'
                                                        onClick={() => void handleRemove(usage)}
                                                    >
                                                        <DeleteOutlineRounded />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        )}
                                    </Paper>
                                ))}
                            </Stack>

                            <Typography align="right" sx={{ fontWeight: 700 }}>
                                Materials total: {formatDecimal(totalCost)}
                            </Typography>
                        </>
                    )}
                </Stack>
            </Paper>

            <MaterialUsageDialog
                materials={materials}
                onClose={() => setIsFormOpen(false)}
                onSaved={handleSavedUsage}
                open={isFormOpen}
                usage={selectedUsage}
                workOrderId={workOrderId}
            />
        </>
    );
}

type MaterialUsageDialogProps = {
    materials: TechnicianMaterial[],
    onClose: () => void,
    onSaved: (usage: WorkOrderMaterialUsage) => void,
    open: boolean,
    usage: WorkOrderMaterialUsage | null,
    workOrderId: string
};

function MaterialUsageDialog({
    materials,
    onClose,
    onSaved,
    open,
    usage,
    workOrderId
}: MaterialUsageDialogProps) {
    const [values, setValues] = useState<MaterialFormValues>(createInitialValues(usage));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const isEditing = usage !== null;

    useEffect(() => {
        if (!open) {
            return;
        }

        setValues(createInitialValues(usage));
        setValidationErrors({});
        setErrorMessage(null);
    }, [open, usage]);

    function getFieldError(fieldName: string): string | undefined {
        return validationErrors[fieldName]?.[0];
    }

    function updateField(fieldName: keyof MaterialFormValues, value: string) {
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

        if (!isEditing && !values.materialId) {
            errors.materialId = ['A material is required.'];
        }

        const quantity = Number(values.quantity);

        if (!values.quantity || Number.isNaN(quantity) || quantity <= 0) {
            errors.quantity = ['Quantity must be greater than 0.'];
        }

        if (values.unitCost) {
            const unitCost = Number(values.unitCost);

            if (Number.isNaN(unitCost) || unitCost < 0) {
                errors.unitCost = ['Unit cost cannot be negative.'];
            }
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

        setIsSubmitting(true);
        setValidationErrors({});
        setErrorMessage(null);

        const quantity = Number(values.quantity);
        const unitCost = values.unitCost ? Number(values.unitCost) : undefined;

        try {
            const savedUsage = isEditing
                ? await updateWorkOrderMaterial(workOrderId, usage.id, {
                    quantity,
                    unitCost
                })
                : await addWorkOrderMaterial(workOrderId, {
                    materialId: values.materialId,
                    quantity,
                    unitCost
                });

            onSaved(savedUsage);
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
                setErrorMessage('Unable to save material usage. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog fullWidth maxWidth='sm' onClose={handleClose} open={open}>
            <Box component='form' onSubmit={e => void handleSubmit(e)}>
                <DialogTitle>
                    {isEditing ? 'Edit material usage' : 'Add material'}
                </DialogTitle>

                <DialogContent dividers>
                    <Stack spacing={2}>
                        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

                        <FormControl
                            disabled={isEditing}
                            error={Boolean(getFieldError('materialId'))}
                            fullWidth
                            required
                        >
                            <InputLabel id='material-usage-material-label'>
                                Material
                            </InputLabel>

                            <Select
                                label='Material'
                                labelId='material-usage-material-label'
                                onChange={e => updateField('materialId', e.target.value)}
                                value={values.materialId}
                            >
                                {materials.map(material => (
                                    <MenuItem key={material.id} value={material.id}>
                                        {material.name}
                                        {material.sku
                                            ? ` (${material.sku})`
                                            : ''}
                                        {' — '}
                                        {material.unitOfMeasure}
                                    </MenuItem>
                                ))}
                            </Select>

                            <FormHelperText>
                                {isEditing
                                    ? 'The material cannot be changed after it has been recorded.'
                                    : getFieldError('materialId')}
                            </FormHelperText>
                        </FormControl>

                        <TextField
                            error={Boolean(getFieldError('quantity'))}
                            helperText={getFieldError('quantity')}
                            fullWidth
                            label='Quantity'
                            onChange={e => updateField('quantity', e.target.value)}
                            value={values.quantity}
                            type='number'
                            slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
                            required
                        />

                        <TextField
                            error={Boolean(getFieldError('unitCost'))}
                            helperText={getFieldError('unitCost') ?? 'Leave blank to use the catalog default cost.'}
                            fullWidth
                            label='Unit cost override'
                            onChange={e => updateField('unitCost', e.target.value)}
                            value={values.unitCost}
                            type='number'
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
                        type='submit'
                        variant='contained'
                    >
                        {isEditing ? 'Save changes' : 'Add material'}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}