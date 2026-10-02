import { useEffect, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { getServiceLocations, type ServiceLocation } from "../features/serviceLocations/serviceLocationApi";
import { getCustomers, type Customer } from "../features/customers/customerApi";
import { Navigate } from "react-router";
import { Alert, Box, Chip, CircularProgress, FormControl, FormControlLabel, InputLabel, MenuItem, Paper, Select, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";

const operationsManagerRoles = ['Owner', 'Manager', 'Dispatcher'];

function formatAddress(location: ServiceLocation) {
    return [
        location.addressLine1,
        location.addressLine2,
        location.city,
        location.postalCode,
        location.country,
    ]
        .filter(Boolean)
        .join(', ');
}

export function ServiceLocationsPage() {
    const { user } = useAuth();

    const [locations, setLocations] = useState<ServiceLocation[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [includeInactive, setIncludeInactive] = useState(false);
    const [isLoadingLocations, setIsLoadingLocations] = useState(true);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
    const [locationsErrorMessage, setLocationsErrorMessage] = useState<string | null>(null);
    const [customersErrorMessage, setCustomersErrorMessage] = useState<string | null>(null);

    const canManageServiceLocations = user?.roles.some(role => operationsManagerRoles.includes(role)) ?? false;

    useEffect(() => {
        let isCurrentRequest = true;

        async function loadCustomers() {
            setIsLoadingCustomers(true);
            setCustomersErrorMessage(null);

            try {
                const response = await getCustomers(false);

                if (isCurrentRequest) {
                    setCustomers(response);
                }
            } catch {
                if (isCurrentRequest) {
                    setCustomersErrorMessage('Unable to load customers for filtering service locations.');
                }
            } finally {
                if (isCurrentRequest) {
                    setIsLoadingCustomers(false);
                }
            }
        }

        void loadCustomers();

        return () => {
            isCurrentRequest = false;
        }
    }, []);

    useEffect(() => {
        let isCurrentRequest = true;

        async function loadLocations() {
            setIsLoadingLocations(true);
            setLocationsErrorMessage(null);

            try {
                const response = await getServiceLocations({
                    customerId: selectedCustomerId || undefined,
                    includeInactive
                });

                if (isCurrentRequest) {
                    setLocations(response);
                }
            } catch {
                if (isCurrentRequest) {
                    setLocationsErrorMessage('Unable to load service locations. Please try again in a moment.');
                }
            } finally {
                if (isCurrentRequest) {
                    setIsLoadingLocations(false);
                }
            }
        }

        void loadLocations();

        return () => {
            isCurrentRequest = false;
        }
    }, [includeInactive, selectedCustomerId]);

    if (!canManageServiceLocations) {
        return <Navigate replace to='/app' />
    }

    return (
        <Stack spacing={3}>
            <Box>
                <Typography component='h1' variant="h4" sx={{ fontWeight: 700 }}>
                    Service locations
                </Typography>

                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    Manage the places where your organization provides service.
                </Typography>
            </Box>

            <Paper sx={{ p: 2 }}>
                <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    spacing={2}
                >
                    <FormControl
                        disabled={isLoadingCustomers}
                        size="small"
                        sx={{ minWidth: { xs: '100%', md: 260 } }}
                    >
                        <InputLabel id="customer-filter-label">
                            Customer
                        </InputLabel>

                        <Select
                            label="Customer"
                            labelId="customer-filter-label"
                            onChange={e => setSelectedCustomerId(e.target.value)}
                            value={selectedCustomerId}
                        >
                            <MenuItem value="">
                                <em>All customers</em>
                            </MenuItem>

                            {customers.map(customer => (
                                <MenuItem key={customer.id} value={customer.id}>
                                    {customer.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControlLabel 
                        control={
                            <Switch 
                                checked={includeInactive}
                                onChange={e => setIncludeInactive(e.target.checked)}  
                            />
                        }
                        label="Include inactive locations"
                    />
                </Stack>
            </Paper>

            {customersErrorMessage && <Alert severity="warning">{customersErrorMessage}</Alert>}

            {locationsErrorMessage && <Alert severity="error">{locationsErrorMessage}</Alert>}

            {isLoadingLocations ? (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        py: 8
                    }}
                >
                    <CircularProgress aria-label="Loading service locations"/>
                </Box>
            ) : locations.length === 0 ? (
                <Paper
                    sx={{
                        border: '1px dashed',
                        borderColor: 'divider',
                        p: 4,
                        textAlign: 'center'
                    }}
                >
                    <Typography sx={{ fontWeight: 600 }} variant="h6">
                        No service locations found
                    </Typography>

                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                        {selectedCustomerId
                            ? 'This customer does not have any matching service locations.'
                            : 'Create a service location for one of your customers to begin scheduling work.'}
                    </Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper} variant="outlined">
                    <Table aria-label="Service locations">
                        <TableHead>
                            <TableRow>
                                <TableCell>Location</TableCell>
                                <TableCell>Customer</TableCell>
                                <TableCell>Address</TableCell>
                                <TableCell>City</TableCell>
                                <TableCell>Country</TableCell>
                                <TableCell>Status</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {locations.map(location => (
                                <TableRow key={location.id} hover>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 600 }}>
                                            {location.name}
                                        </Typography>
                                    </TableCell>

                                    <TableCell>
                                        {location.customerName}
                                    </TableCell>

                                    <TableCell>
                                        {formatAddress(location)}
                                    </TableCell>

                                    <TableCell>
                                        {location.city}
                                    </TableCell>

                                    <TableCell>
                                        {location.country}
                                    </TableCell>

                                    <TableCell>
                                        <Chip 
                                            color={location.isActive ? 'success' : 'default'}
                                            label={location.isActive ? 'Active' : 'Inactive'}
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