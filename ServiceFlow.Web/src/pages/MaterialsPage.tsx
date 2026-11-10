import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { getMaterials, type Material } from "../features/materialsCatalog/materialsCatalogApi";
import { Navigate } from "react-router";
import { Alert, Box, Button, Chip, CircularProgress, FormControlLabel, IconButton, Pagination, Paper, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography } from "@mui/material";
import { AddRounded, EditRounded, PersonOffRounded } from "@mui/icons-material";
import { MaterialFormDialog } from "../features/materialsCatalog/MaterialFormDialog";
import { MaterialDeactivateDialog } from "../features/materialsCatalog/MaterialDeactivateDialog";

const operationsManagerRoles = ['Owner', 'Manager', 'Dispatcher'];

const pageSize = 25;

function formatCost(value: number) {
    return value.toFixed(2);
}

export function MaterialsPage() {
    const { user } = useAuth();

    const [materials, setMaterials] = useState<Material[]>([]);
    const [includeInactive, setIncludeInactive] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
    const [materialToDeactivate, setMaterialToDeactivate] = useState<Material | null>(null);

    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const canManageMaterials = user?.roles.some(role => operationsManagerRoles.includes(role)) ?? false;

    const loadMaterials = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage(null);

        try {
            const response = await getMaterials({
                search,
                includeInactive,
                page,
                pageSize
            });

            setMaterials(response.items);
            setTotalCount(response.totalCount);
            setTotalPages(response.totalPages);
        } catch {
            setErrorMessage('Unable to load the material catalog. Please try again in a moment.');
        } finally {
            setIsLoading(false);
        }
    }, [includeInactive, search, page]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setSearch(searchInput.trim());
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchInput]);

    useEffect(() => {
        void loadMaterials();
    }, [loadMaterials]);

    if (!canManageMaterials) {
        return <Navigate to='/app' replace />
    }

    function openCreateDialog() {
        setSelectedMaterial(null);
        setIsFormOpen(true);
    }

    function openEditDialog(material: Material) {
        setSelectedMaterial(material);
        setIsFormOpen(true);
    }

    function handleMaterialSaved() {
        void loadMaterials();
    }

    function handleMaterialDeactivated() {
        void loadMaterials();
    }

    return (
        <>
            <Stack spacing={3}>
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{
                        alignItems: { xs: 'stretch', sm: 'center' },
                        justifyContent: 'space-between'
                    }}
                >
                    <Box>
                        <Typography component='h1' variant="h4" sx={{ fontWeight: 700 }}>
                            Materials
                        </Typography>

                        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                            Manage the materials technicians can record against work orders.
                        </Typography>
                    </Box>

                    <Button
                        onClick={openCreateDialog}
                        startIcon={<AddRounded />}
                        variant="contained"
                    >
                        New material
                    </Button>
                </Stack>

                <Paper sx={{ p: 2 }}>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                    >
                        <TextField
                            label='Search materials'
                            placeholder="Name, SKU, or unit"
                            onChange={e => {
                                setSearchInput(e.target.value);
                                setPage(1);
                            }}
                            value={searchInput}
                            size="small"
                            sx={{ minWidth: { xs: '100%', sm: 280 } }}
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={includeInactive}
                                    onChange={e => {
                                        setIncludeInactive(e.target.checked);
                                        setPage(1);
                                    }}
                                />
                            }
                            label='Include inactive materials'
                        />
                    </Stack>
                </Paper>

                {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

                {isLoading ? (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            py: 8
                        }}
                    >
                        <CircularProgress aria-label="Loading materials" />
                    </Box>
                ) : materials.length === 0 ? (
                    <Paper
                        sx={{
                            border: '1px dashed',
                            borderColor: 'divider',
                            p: 4,
                            textAlign: 'center'
                        }}
                    >
                        <Typography sx={{ fontWeight: 600 }} variant="h6">
                            No materials found
                        </Typography>

                        {search
                            ? 'No materials match the current search and filter settings.'
                            : includeInactive
                                ? 'No active or inactive materials are available.'
                                : 'Create your first material to make it available to technicians.'}
                    </Paper>
                ) : (
                    <TableContainer component={Paper} variant="outlined">
                        <Table aria-label="Material catalog">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Material</TableCell>
                                    <TableCell>SKU</TableCell>
                                    <TableCell>Unit</TableCell>
                                    <TableCell align="right">Default unit cost</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {materials.map(material => (
                                    <TableRow key={material.id} hover>
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 600 }}>
                                                {material.name}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            {material.sku ?? '—'}
                                        </TableCell>

                                        <TableCell>
                                            {material.unitOfMeasure}
                                        </TableCell>

                                        <TableCell align="right">
                                            {formatCost(material.defaultUnitCost)}
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                color={material.isActive ? 'success' : 'default'}
                                                label={material.isActive ? 'Active' : 'Inactive'}
                                                size="small"
                                            />
                                        </TableCell>

                                        <TableCell align="right">
                                            <Tooltip title='Edit material'>
                                                <IconButton
                                                    aria-label={`Edit ${material.name}`}
                                                    onClick={() => openEditDialog(material)}
                                                >
                                                    <EditRounded />
                                                </IconButton>
                                            </Tooltip>

                                            {material.isActive && (
                                                <Tooltip title='Deactivate material'>
                                                    <IconButton
                                                        aria-label={`Deactivate ${material.name}`}
                                                        onClick={() => setMaterialToDeactivate(material)}
                                                        color="warning"
                                                    >
                                                        <PersonOffRounded />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{
                        alignItems: { xs: 'stretch', sm: 'center' },
                        justifyContent: 'space-between'
                    }}
                >
                    <Typography color="text.secondary" variant="body2">
                        {totalCount} material{totalCount === 1 ? '' : 's'}
                    </Typography>

                    {totalPages > 1 && (
                        <Pagination
                            count={totalPages}
                            onChange={(_, value) => setPage(value)}
                            page={page}
                            shape="rounded"
                        />
                    )}
                </Stack>
            </Stack>

            <MaterialFormDialog
                material={selectedMaterial}
                onClose={() => setIsFormOpen(false)}
                onSaved={handleMaterialSaved}
                open={isFormOpen}
            />

            <MaterialDeactivateDialog
                material={materialToDeactivate}
                onClose={() => setMaterialToDeactivate(null)}
                onDeactivated={handleMaterialDeactivated}
                open={materialToDeactivate !== null}
            />
        </>
    );
}