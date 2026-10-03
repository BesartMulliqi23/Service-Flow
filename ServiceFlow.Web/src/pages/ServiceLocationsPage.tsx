import { useEffect, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { createServiceLocation, getServiceLocations, updateServiceLocation, type ServiceLocation } from "../features/serviceLocations/serviceLocationApi";
import { getCustomers, type Customer } from "../features/customers/customerApi";
import { Navigate } from "react-router";
import { Alert, Box, Button, Chip, CircularProgress, FormControl, FormControlLabel, IconButton, InputLabel, MenuItem, Paper, Select, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import { AddRounded, EditRounded, PersonOffRounded } from "@mui/icons-material";
import { ServiceLocationFormDialog } from "../features/serviceLocations/ServiceLocationFormDialog";
import { ServiceLocationDeactivateDialog } from "../features/serviceLocations/ServiceLocationDeactivateDialog";

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

function sortLocations(locations: ServiceLocation[]) {
    return [...locations].sort(
        (first, second) => 
            first.customerName.localeCompare(second.customerName) ||
            first.name.localeCompare(second.name)
    );
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
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<ServiceLocation | null>(null);
    const [locationToDeactivate, setLocationToDeactivate] = useState<ServiceLocation | null>(null);

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

    function openCreateDialog() {
        setSelectedLocation(null);
        setIsFormOpen(true);
    }

    function openEditDialog(location: ServiceLocation) {
        setSelectedLocation(location);
        setIsFormOpen(true);
    }

    function handleLocationSaved(savedLocation: ServiceLocation) {
        const matchesCurrentCustomerFilter = !selectedCustomerId || savedLocation.customerId === selectedCustomerId;

        setLocations(currentLocations => {
            const locationsWithoutSavedLocation = currentLocations.filter(
                location => location.id !== savedLocation.id
            );

            if (!matchesCurrentCustomerFilter) {
                return locationsWithoutSavedLocation;
            }

            return sortLocations([...locationsWithoutSavedLocation, savedLocation]);
        });
    }

    function handleLocationDeactivated(serviceLocationId: string) {
        setLocations(currentLocations => {
            if (!includeInactive) {
                return currentLocations.filter(location => location.id !== serviceLocationId);
            }

            return currentLocations.map(location => 
                location.id === serviceLocationId ? { ...location, isActive: false} : location
            );
        });
    }

    return (
        <>
            <Stack spacing={3}>
                <Stack
                    spacing={2}
                    direction={{ xs: 'column', sm: 'row' }}
                    sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                >
                    <Box>
                        <Typography component='h1' variant="h4" sx={{ fontWeight: 700 }}>
                            Service locations
                        </Typography>

                        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                            Manage the places where your organization provides service.
                        </Typography>
                    </Box>

                    <Button
                        disabled={isLoadingCustomers || customers.length === 0}
                        onClick={openCreateDialog}
                        startIcon={<AddRounded />}
                        variant="contained"
                    >
                        New location
                    </Button>
                </Stack>

                {!isLoadingCustomers && customers.length === 0 && (
                    <Alert severity="info">
                        Create an active customer before creating a service location.
                    </Alert>
                )}

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
                        <CircularProgress aria-label="Loading service locations" />
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
                                    <TableCell align="right">Actions</TableCell>
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

                                        <TableCell align="right" sx={{ whiteSpace: 'nowrap'}}>
                                            <Tooltip title="Edit service location">
                                                <IconButton
                                                    aria-label={`Edit ${location.name}`}
                                                    onClick={() => openEditDialog(location)}
                                                >
                                                    <EditRounded />
                                                </IconButton>
                                            </Tooltip>

                                            {location.isActive && (
                                                <Tooltip title="Deactivate service location">
                                                    <IconButton
                                                        aria-label={`Deactivate ${location.name}`}
                                                        onClick={() => setLocationToDeactivate(location)}
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
            </Stack>

            <ServiceLocationFormDialog 
                customers={customers}
                location={selectedLocation}
                onClose={() => setIsFormOpen(false)}
                onSaved={handleLocationSaved}
                onSubmit={input =>
                    selectedLocation
                        ? updateServiceLocation(selectedLocation.id, input)
                        : createServiceLocation(input)
                }
                open={isFormOpen}
            />

            <ServiceLocationDeactivateDialog 
                location={locationToDeactivate}
                onClose={() => setLocationToDeactivate(null)}
                onDeactivated={handleLocationDeactivated}
                open={locationToDeactivate !== null}
            />
        </>
    );
}