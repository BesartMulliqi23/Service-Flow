import { useEffect, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { getCustomers, type Customer } from "../features/customers/customerApi";
import { Navigate } from "react-router";
import { Alert, Box, Button, Chip, CircularProgress, FormControlLabel, IconButton, Paper, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import { AddRounded, EditRounded } from "@mui/icons-material";
import { CustomerFormDialog } from "../features/customers/CustomerFormDialog";

const operationsManagerRoles = ['Owner', 'Manager', 'Dispatcher'];

function sortCustomers(customers: Customer[]) {
    return [...customers].sort((first, second) => first.name.localeCompare(second.name));
}

export function CustomersPage() {
    const { user } = useAuth();

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [includeInactive, setIncludeInactive] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

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

    function openCreateDialog() {
        setSelectedCustomer(null);
        setIsFormOpen(true);
    }

    function openEditDialog(customer: Customer) {
        setSelectedCustomer(customer);
        setIsFormOpen(true);
    }

    function handleCustomerSaved(savedCustomer: Customer) {
        setCustomers(currentCustomers => {
            const existingCustomerIndex = currentCustomers.findIndex(
                customer => customer.id === savedCustomer.id
            );

            if (existingCustomerIndex === -1) {
                return sortCustomers([...currentCustomers, savedCustomer]);
            }

            return sortCustomers(
                currentCustomers.map(customer =>
                    customer.id === savedCustomer.id ? savedCustomer : customer
                )
            );
        });
    }

    return (
        <>
            <Stack spacing={3}>
                <Stack
                    spacing={2}
                    sx={{
                        alignItems: { xs: 'stretch', sm: 'center' },
                        justifyContent: 'space-between'
                    }}
                    direction={{ xs: 'column', sm: 'row' }}
                >
                    <Box>
                        <Typography component='h1' variant="h4" sx={{ fontWeight: 700 }}>
                            Customers
                        </Typography>

                        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                            Manage customer records for your organization.
                        </Typography>
                    </Box>

                    <Button
                        onClick={openCreateDialog}
                        startIcon={<AddRounded />}
                        variant="contained"
                    >
                        New customer
                    </Button>
                </Stack>

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
                ) : (
                    <TableContainer component={Paper} variant="outlined">
                        <Table aria-label="Customers">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Customer</TableCell>
                                    <TableCell>Contact</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Phone</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
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

                                        <TableCell align="right">
                                            <Tooltip title="Edit customer">
                                                <IconButton
                                                    aria-label={`Edit ${customer.name}`}
                                                    onClick={() => openEditDialog(customer)}
                                                >
                                                    <EditRounded />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Stack>

            <CustomerFormDialog 
                customer={selectedCustomer}
                onClose={() => setIsFormOpen(false)}
                onSaved={handleCustomerSaved}
                open={isFormOpen}
            />
        </>
    );
}