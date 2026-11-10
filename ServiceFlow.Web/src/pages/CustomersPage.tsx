import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { getCustomers, type Customer } from "../features/customers/customerApi";
import { Navigate } from "react-router";
import { Alert, Box, Button, Chip, CircularProgress, FormControlLabel, IconButton, Pagination, Paper, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography } from "@mui/material";
import { AddRounded, EditRounded, PersonOffRounded } from "@mui/icons-material";
import { CustomerFormDialog } from "../features/customers/CustomerFormDialog";
import { CustomerDeactivateDialog } from "../features/customers/CustomerDeactivateDialog";

const operationsManagerRoles = ['Owner', 'Manager', 'Dispatcher'];

const pageSize = 25;

export function CustomersPage() {
    const { user } = useAuth();

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [includeInactive, setIncludeInactive] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerToDeactivate, setCustomerToDeactivate] = useState<Customer | null>(null);

    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const canManageCustomers = user?.roles.some(role => operationsManagerRoles.includes(role)) ?? false;

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setSearch(searchInput.trim());
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchInput]);

    const loadCustomers = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage(null);

        try {
            const response = await getCustomers({
                search,
                includeInactive,
                page,
                pageSize
            });

            setCustomers(response.items);
            setTotalCount(response.totalCount);
            setTotalPages(response.totalPages);
        } catch {
            setErrorMessage('Unable to load customers. Please try again in a moment.');
        } finally {
            setIsLoading(false);
        }
    }, [includeInactive, page, search]);

    useEffect(() => {
        void loadCustomers();
    }, [loadCustomers]);

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

    function handleCustomerSaved() {
        void loadCustomers();
    }

    function handleCustomerDeactivated() {
        void loadCustomers();
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
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            label='Search customers'
                            onChange={e => {
                                setSearchInput(e.target.value);
                                setPage(1);
                            }}
                            value={searchInput}
                            placeholder="Name, contact, email, or phone"
                            size="small"
                            sx={{ minWidth: { xs: '100%', sm: 320 } }}
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
                            label="Include inactive customers"
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
                            {search
                                ? 'No customers match the current search and filter settings.'
                                : includeInactive
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

                                            {customer.isActive && (
                                                <Tooltip title="Deactivate customer">
                                                    <IconButton
                                                        aria-label={`Deactivate ${customer.name}`}
                                                        color="warning"
                                                        onClick={() => setCustomerToDeactivate(customer)}
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
                    spacing={2}
                    sx={{
                        alignItems: { xs: 'stretch', sm: 'center' },
                        justifyContent: 'space-between'
                    }}
                    direction={{ xs: 'column', sm: 'row' }}
                >
                    <Typography color="text.secondary" variant="body2">
                        {totalCount} customer{totalCount === 1 ? '' : 's'}
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

            <CustomerFormDialog
                customer={selectedCustomer}
                onClose={() => setIsFormOpen(false)}
                onSaved={handleCustomerSaved}
                open={isFormOpen}
            />

            <CustomerDeactivateDialog
                customer={customerToDeactivate}
                onClose={() => setCustomerToDeactivate(null)}
                onDeactivated={handleCustomerDeactivated}
                open={customerToDeactivate !== null}
            />
        </>
    );
}