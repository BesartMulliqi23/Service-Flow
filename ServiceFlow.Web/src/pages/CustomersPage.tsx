import { useEffect, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { getCustomers, type Customer } from "../features/customers/customerApi";
import { Navigate } from "react-router";
import { Alert, Box, Chip, CircularProgress, FormControlLabel, Paper, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";

const operationsManagerRoles = ['Owner', 'Manager', 'Dispatcher'];

export function CustomersPage() {
    const { user } = useAuth();

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [includeInactive, setIncludeInactive] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const canManageCustomers = user?.roles.some(role => operationsManagerRoles.includes(role)) ?? false;

    useEffect(() => {
        let isCurrentRequest = true;

        async function loadCustomers() {
            setIsLoading(true);
            setErrorMessage(null);

            try {
                const response = await getCustomers(includeInactive);

                if (isCurrentRequest) {
                    setCustomers(response);
                }
            } catch {
                if (isCurrentRequest) {
                    setErrorMessage('Unable to load customers. Please try again in a moment.');
                }
            } finally {
                if (isCurrentRequest) {
                    setIsLoading(false);
                }
            }
        }

        void loadCustomers();

        return () => {
            isCurrentRequest = false;
        }
    }, [includeInactive]);

    if (!canManageCustomers) {
        return <Navigate to='/app' replace />
    }

    return (
        <Stack spacing={3}>
            <Box>
                <Typography component='h1' variant="h4" sx={{ fontWeight: 700 }}>
                    Customers
                </Typography>

                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    Manage customer records for your organization.
                </Typography>
            </Box>

            <Paper sx={{ p: 2 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={includeInactive}
                            onChange={e => setIncludeInactive(e.target.checked)}
                        />
                    }
                    label="Include inactive customers"
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
                    <CircularProgress aria-label="Loading customers" />
                </Box>
            ) : customers.length === 0 ? (
                <Paper
                    sx={{
                        border: '1px dashed',
                        borderColor: 'divider',
                        p: 4,
                        textAlign: 'center'
                    }}
                >
                    <Typography sx={{ fontWeight: 600 }} variant="h6">
                        No customers found
                    </Typography>

                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                        {includeInactive
                            ? 'No active or inactive customers are available.'
                            : 'Create your first customer to begin managing service locations and work orders.'}
                    </Typography>
                </Paper>
            ): (
                <TableContainer component={Paper} variant="outlined">
                    <Table aria-label="Customers">
                        <TableHead>
                            <TableRow>
                                <TableCell>Customer</TableCell>
                                <TableCell>Contact</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Phone</TableCell>
                                <TableCell>Status</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {customers.map(customer => (
                                <TableRow key={customer.id} hover>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 600 }}>
                                            {customer.name}
                                        </Typography>
                                    </TableCell>

                                    <TableCell>
                                        {customer.contactName ?? '—'}
                                    </TableCell>

                                    <TableCell>
                                        {customer.email ?? '—'}
                                    </TableCell>

                                    <TableCell>
                                        {customer.phoneNumber ?? '—'}
                                    </TableCell>

                                    <TableCell>
                                        <Chip 
                                            color={customer.isActive ? 'success' : 'default'}
                                            label={customer.isActive ? 'Active' : 'Inactive'}
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