import { useEffect, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { createWorkOrder, getWorkOrders, updateWorkOrder, type WorkOrder, type WorkOrderPriority, type WorkOrderStatus } from "../features/workOrders/workOrderApi";
import { getServiceLocations, type ServiceLocation } from "../features/serviceLocations/serviceLocationApi";
import { Navigate } from "react-router";
import { Alert, Box, Button, Chip, CircularProgress, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import { AddRounded, EditRounded } from "@mui/icons-material";
import { WorkOrderFormDialog } from "../features/workOrders/WorkOrderFormDialog";

const operationsManagerRoles = ['Owner', 'Manager', 'Dispatcher'];

const workOrderStatuses: WorkOrderStatus[] = [
    'Draft',
    'Scheduled',
    'InProgress',
    'Completed',
    'Cancelled'
];

function getPriorityColor(priority: WorkOrderPriority) {
    switch (priority) {
        case 'Urgent':
            return 'error';
        case 'High':
            return 'warning';
        case 'Normal':
            return 'primary';
        case 'Low':
            return 'default'
    }
}

function getStatusColor(status: WorkOrderStatus) {
    switch (status) {
        case 'Draft':
            return 'default';
        case 'Scheduled':
            return 'primary';
        case 'InProgress':
            return 'warning';
        case 'Completed':
            return 'success';
        case 'Cancelled':
            return 'error';
    }
}

function formatStatus(status: WorkOrderStatus) {
    return status === 'InProgress' ? 'In progress' : status;
}

function formatDate(value: string | null) {
    if (!value) {
        return '—';
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium'
    }).format(new Date(value));
}

function formatSchedule(workOrder: WorkOrder) {
    if (!workOrder.scheduledStartUtc || !workOrder.scheduledEndUtc) {
        return 'Not scheduled';
    }

    const formatter = new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    return `${formatter.format(new Date(workOrder.scheduledStartUtc))} – ${formatter.format(
        new Date(workOrder.scheduledEndUtc))}`;
}

export function WorkOrdersPage() {
    const { user } = useAuth();

    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [serviceLocations, setServiceLocations] = useState<ServiceLocation[]>([]);
    const [selectedServiceLocationId, setSelectedServiceLocationId] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<WorkOrderStatus | ''>('');
    const [isLoadingWorkOrders, setIsLoadingWorkOrders] = useState(true);
    const [isLoadingServiceLocations, setIsLoadingServiceLocations] = useState(true);
    const [workOrdersErrorMessage, setWorkOrdersErrorMessage] = useState<string | null>(null);
    const [serviceLocationsErrorMessage, setServiceLocationsErrorMessage] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);

    const canManageWorkOrders = user?.roles.some(role => operationsManagerRoles.includes(role)) ?? false;

    const activeServiceLocations = serviceLocations.filter(location => location.isActive);

    useEffect(() => {
        let isCurrentRequest = true;

        async function loadServiceLocations() {
            setIsLoadingServiceLocations(true);
            setServiceLocationsErrorMessage(null);

            try {
                const response = await getServiceLocations({
                    includeInactive: true
                });

                if (isCurrentRequest) {
                    setServiceLocations(response);
                }
            } catch {
                if (isCurrentRequest) {
                    setServiceLocationsErrorMessage('Unable to load service locations for filtering work orders.');
                }
            } finally {
                if (isCurrentRequest) {
                    setIsLoadingServiceLocations(false);
                }
            }
        }

        void loadServiceLocations();

        return () => {
            isCurrentRequest = false;
        };
    }, []);

    useEffect(() => {
        let isCurrentRequest = true;

        async function loadWorkOrders() {
            setIsLoadingWorkOrders(true);
            setWorkOrdersErrorMessage(null);

            try {
                const response = await getWorkOrders({
                    serviceLocationId: selectedServiceLocationId || undefined,
                    status: selectedStatus || undefined
                });

                if (isCurrentRequest) {
                    setWorkOrders(response);
                }
            } catch {
                if (isCurrentRequest) {
                    setWorkOrdersErrorMessage('Unable to load work orders. Please try again in a moment.');
                }
            } finally {
                if (isCurrentRequest) {
                    setIsLoadingWorkOrders(false);
                }
            }
        }

        void loadWorkOrders();

        return () => {
            isCurrentRequest = false;
        };
    }, [selectedServiceLocationId, selectedStatus]);

    if (!canManageWorkOrders) {
        return <Navigate to='/app' replace />
    }

    function openCreateDialog() {
        setSelectedWorkOrder(null);
        setIsFormOpen(true);
    }

    function openEditDialog(workOrder: WorkOrder) {
        setSelectedWorkOrder(workOrder);
        setIsFormOpen(true);
    }

    function handleWorkOrderSaved(savedWorkOrder: WorkOrder) {
        const matchesServiceLocationFilter =
            !selectedServiceLocationId || savedWorkOrder.serviceLocationId === selectedServiceLocationId;

        const matchesStatusFilter =
            !selectedStatus || savedWorkOrder.status === selectedStatus;

        setWorkOrders(currentWorkOrders => {
            const withoutSavedWorkOrder = currentWorkOrders.filter(order => order.id !== savedWorkOrder.id);

            if (!matchesServiceLocationFilter || !matchesStatusFilter) {
                return withoutSavedWorkOrder;
            }

            if (currentWorkOrders.some(order => order.id === savedWorkOrder.id)) {
                return [...withoutSavedWorkOrder, savedWorkOrder];
            }

            return [savedWorkOrder, ...withoutSavedWorkOrder];
        });
    }

    return (
        <>
            <Stack spacing={3}>
                <Stack
                    spacing={2}
                    direction={{ xs: 'column', sm: 'row' }}
                    sx={{
                        alignItems: { xs: 'stretch', sm: 'center' },
                        justifyContent: 'space-between'
                    }}
                >
                    <Box>
                        <Typography component='h1' variant='h4' sx={{ fontWeight: 700 }}>
                            Work orders
                        </Typography>

                        <Typography color='text.secondary' sx={{ mt: 0.5 }}>
                            Manage service requests, scheduling, and technician assignments.
                        </Typography>
                    </Box>

                    <Button
                        disabled={isLoadingServiceLocations || activeServiceLocations.length === 0}
                        onClick={openCreateDialog}
                        startIcon={<AddRounded />}
                        variant="contained"
                    >
                        New work order
                    </Button>
                </Stack>

                {!isLoadingServiceLocations && activeServiceLocations.length === 0 && (
                    <Alert severity="info">
                        Create an active service location before creating a Work Order.
                    </Alert>
                )}

                <Paper sx={{ p: 2 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <FormControl
                            disabled={isLoadingServiceLocations}
                            size="small"
                            sx={{ minWidth: { xs: '100%', md: 280 } }}
                        >
                            <InputLabel id='work-order-location-filter-label'>
                                Service location
                            </InputLabel>

                            <Select
                                label="Service location"
                                labelId="work-order-location-filter-label"
                                onChange={e => setSelectedServiceLocationId(e.target.value)}
                                value={selectedServiceLocationId}
                            >
                                <MenuItem value="">
                                    <em>All service locations</em>
                                </MenuItem>

                                {serviceLocations.map(sl => (
                                    <MenuItem key={sl.id} value={sl.id}>
                                        {sl.customerName} — {sl.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl
                            size="small"
                            sx={{ minWidth: { xs: '100%', md: 180 } }}
                        >
                            <InputLabel id='work-order-status-filter-label'>
                                Status
                            </InputLabel>

                            <Select
                                label="Status"
                                labelId="work-order-status-filter-label"
                                onChange={e => setSelectedStatus(e.target.value)}
                                value={selectedStatus}
                            >
                                <MenuItem value="">
                                    <em>All statuses</em>
                                </MenuItem>

                                {workOrderStatuses.map(status => (
                                    <MenuItem key={status} value={status}>
                                        {formatStatus(status)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </Paper>

                {serviceLocationsErrorMessage && <Alert severity="error">{serviceLocationsErrorMessage}</Alert>}

                {workOrdersErrorMessage && <Alert severity="error">{workOrdersErrorMessage}</Alert>}

                {isLoadingWorkOrders ? (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            py: 8
                        }}
                    >
                        <CircularProgress aria-label="Loading work orders" />
                    </Box>
                ) : workOrders.length === 0 ? (
                    <Paper
                        sx={{
                            border: '1px dashed',
                            borderColor: 'divider',
                            p: 4,
                            textAlign: 'center'
                        }}
                    >
                        <Typography sx={{ fontWeight: 600 }} component="h6">
                            No work orders found
                        </Typography>

                        <Typography color="text.secondary" sx={{ mt: 1 }}>
                            Create a draft work order to begin planning service work.
                        </Typography>
                    </Paper>
                ) : (
                    <TableContainer component={Paper} variant="outlined">
                        <Table aria-label="Work orders">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Work order</TableCell>
                                    <TableCell>Customer</TableCell>
                                    <TableCell>Service location</TableCell>
                                    <TableCell>Priority</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Due</TableCell>
                                    <TableCell>Schedule</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {workOrders.map(workOrder => (
                                    <TableRow key={workOrder.id} hover>
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 600 }}>
                                                {workOrder.title}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>{workOrder.customerName}</TableCell>

                                        <TableCell>{workOrder.serviceLocationName}</TableCell>

                                        <TableCell>
                                            <Chip
                                                color={getPriorityColor(workOrder.priority)}
                                                label={workOrder.priority}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                color={getStatusColor(workOrder.status)}
                                                label={formatStatus(workOrder.status)}
                                                size="small"
                                            />
                                        </TableCell>

                                        <TableCell>
                                            {formatDate(workOrder.dueUtc)}
                                        </TableCell>

                                        <TableCell>
                                            {formatSchedule(workOrder)}
                                        </TableCell>

                                        <TableCell align="right">
                                            {workOrder.status === 'Draft' ? (
                                                <Tooltip title='Edit draft work order'>
                                                    <IconButton
                                                        aria-label={`Edit ${workOrder.title}`}
                                                        onClick={() => openEditDialog(workOrder)}
                                                    >
                                                        <EditRounded />
                                                    </IconButton>
                                                </Tooltip>
                                            ) : (
                                                '—'
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Stack>

            <WorkOrderFormDialog 
                onClose={() => setIsFormOpen(false)}
                onSaved={handleWorkOrderSaved}
                onSubmit={input => 
                    selectedWorkOrder ? updateWorkOrder(selectedWorkOrder.id, input) : createWorkOrder(input)
                }
                open={isFormOpen}
                serviceLocations={serviceLocations}
                workOrder={selectedWorkOrder}
            />
        </>
    );
}