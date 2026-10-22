import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { getMaterials, type Material } from "../features/materialsCatalog/materialsCatalogApi";
import { Navigate } from "react-router";
import { Alert, Box, Chip, CircularProgress, FormControlLabel, Paper, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";

const operationsManagerRoles = ['Owner', 'Manager', 'Dispatcher'];

function formatCost(value: number) {
    return value.toFixed(2);
}

export function MaterialsPage() {
    const { user } = useAuth();

    const [materials, setMaterials] = useState<Material[]>([]);
    const [includeInactive, setIncludeInactive] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const canManageMaterials = user?.roles.some(role => operationsManagerRoles.includes(role)) ?? false;

    const loadMaterials = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage(null);

        try {
            const response = await getMaterials(includeInactive);
            setMaterials(response);
        } catch {
            setErrorMessage('Unable to load the material catalog. Please try again in a moment.');
        } finally {
            setIsLoading(false);
        }
    }, [includeInactive]);

    useEffect(() => {
        void loadMaterials();
    }, [loadMaterials]);

    if (!canManageMaterials) {
        return <Navigate to='/app' replace />
    }

    return (
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
            </Stack>

            <Paper sx={{ p: 2 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={includeInactive}
                            onChange={e => setIncludeInactive(e.target.checked)}
                        />
                    }
                    label='Include inactive materials'
                />
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
                    <CircularProgress aria-label="Loading materials"/>
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

                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                        {includeInactive
                            ? 'No active or inactive materials are available.'
                            : 'Create your first material to make it available to technicians.'}
                    </Typography>
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
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Stack>
    );
}