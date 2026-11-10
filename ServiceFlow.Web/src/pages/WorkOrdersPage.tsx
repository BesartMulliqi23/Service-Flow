import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { createWorkOrder, getWorkOrders, updateWorkOrder, type WorkOrder, type WorkOrderPriority, type WorkOrderStatus } from "../features/workOrders/workOrderApi";
import { getServiceLocationLookup, type ServiceLocationLookup } from "../features/serviceLocations/serviceLocationApi";
import { Navigate } from "react-router";
import { Alert, Box, Button, Chip, CircularProgress, FormControl, IconButton, InputLabel, MenuItem, Pagination, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography } from "@mui/material";
import { AddRounded, AttachFileRounded, EditRounded, EventRounded, GroupAddRounded, NotesRounded } from "@mui/icons-material";
import { WorkOrderFormDialog } from "../features/workOrders/WorkOrderFormDialog";
import { ScheduleWorkOrderDialog } from "../features/workOrders/ScheduleWorkOrderDialog";
import { WorkOrderAssignmentsDialog } from "../features/workOrders/WorkOrderAssignmentsDialog";
import { WorkOrderNotesDialog } from "../features/workOrderNotes/WorkOrderNotesDialog";
import { WorkOrderAttachmentsDialog } from "../features/workOrderAttachments/WorkOrderAttachmentsDialog";

const operationsManagerRoles = ['Owner', 'Manager', 'Dispatcher'];

const workOrderStatuses: WorkOrderStatus[] = [
    'Draft',
    'Scheduled',
    'InProgress',
    'Completed',
    'Cancelled'
];

const workOrderPriorities: WorkOrderPriority[] = [
    'Low',
    'Normal',
    'High',
    'Urgent'
];

const pageSize = 25;

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
    const [serviceLocations, setServiceLocations] = useState<ServiceLocationLookup[]>([]);
    const [selectedServiceLocationId, setSelectedServiceLocationId] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<WorkOrderStatus | ''>('');
    const [isLoadingWorkOrders, setIsLoadingWorkOrders] = useState(true);
    const [isLoadingServiceLocations, setIsLoadingServiceLocations] = useState(true);
    const [workOrdersErrorMessage, setWorkOrdersErrorMessage] = useState<string | null>(null);
    const [serviceLocationsErrorMessage, setServiceLocationsErrorMessage] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
    const [workOrderToSchedule, setWorkOrderToSchedule] = useState<WorkOrder | null>(null);
    const [workOrderToAssign, setWorkOrderToAssign] = useState<WorkOrder | null>(null);
    const [workOrderToViewNotes, setWorkOrderToViewNotes] = useState<WorkOrder | null>(null);
    const [workOrderToViewAttachments, setWorkOrderToViewAttachments] = useState<WorkOrder | null>(null);

    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [selectedPriority, setSelectedPriority] = useState<WorkOrderPriority | ''>('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const canManageWorkOrders = user?.roles.some(role => operationsManagerRoles.includes(role)) ?? false;

    const activeServiceLocations = serviceLocations.filter(location => location.isActive);

    useEffect(() => {
        let isCurrentRequest = true;

        async function loadServiceLocations() {
            setIsLoadingServiceLocations(true);
            setServiceLocationsErrorMessage(null);

            try {
                const response = await getServiceLocationLookup(true);

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
        const timeoutId = setTimeout(() => {
            setSearch(searchInput.trim());
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchInput]);

    const loadWorkOrders = useCallback(async () => {
        setIsLoadingWorkOrders(true);
        setWorkOrdersErrorMessage(null);

        try {
            const response = await getWorkOrders({
                search,
                serviceLocationId: selectedServiceLocationId || undefined,
                status: selectedStatus || undefined,
                priority: selectedPriority || undefined,
                page,
                pageSize
            });

            setWorkOrders(response.items);
            setTotalCount(response.totalCount);
            setTotalPages(response.totalPages);
        } catch {
            setWorkOrdersErrorMessage('Unable to load work orders. Please try again in a moment.');
        } finally {
            setIsLoadingWorkOrders(false);
        }
    }, [search, selectedServiceLocationId, selectedStatus, selectedPriority, page]);

    useEffect(() => {
        void loadWorkOrders();
    }, [loadWorkOrders]);

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

    function openScheduleDialog(workOrder: WorkOrder) {
        setWorkOrderToSchedule(workOrder);
    }

    function openAssignmentDialog(workOrder: WorkOrder) {
        setWorkOrderToAssign(workOrder);
    }

    function handleWorkOrderSaved() {
        void loadWorkOrders();
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
                        <TextField
                            label='Search work orders'
                            placeholder="Title, customer, or location"
                            onChange={e => {
                                setSearchInput(e.target.value);
                                setPage(1);
                            }}
                            value={searchInput}
                            size="small"
                            sx={{ minWidth: { xs: '100%', md: 280 } }}
                        />

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
                                onChange={e => {
                                    setSelectedServiceLocationId(e.target.value);
                                    setPage(1);
                                }}
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
                                onChange={e => {
                                    setSelectedStatus(e.target.value);
                                    setPage(1);
                                }}
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

                        <FormControl
                            size="small"
                            sx={{ minWidth: { xs: '100%', md: 160 } }}
                        >
                            <InputLabel id='work-order-priority-filter-label'>
                                Priority
                            </InputLabel>

                            <Select
                                label='Priority'
                                labelId='work-order-priority-filter-label'
                                onChange={e => {
                                    setSelectedPriority(e.target.value as WorkOrderPriority | '');
                                    setPage(1);
                                }}
                                value={selectedPriority}
                            >
                                <MenuItem value=''>
                                    <em>All priorities</em>
                                </MenuItem>

                                {workOrderPriorities.map(priority => (
                                    <MenuItem key={priority} value={priority}>
                                        {priority}
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

                        {search || selectedServiceLocationId || selectedStatus || selectedPriority
                            ? 'No work orders match the current search and filter settings.'
                            : 'Create a draft work order to begin planning service work.'}
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
                                            <Stack
                                                direction='row'
                                                spacing={0.5}
                                                sx={{ justifyContent: 'flex-end' }}
                                            >
                                                <Tooltip title='View job notes'>
                                                    <IconButton
                                                        aria-label={`View notes for ${workOrder.title}`}
                                                        onClick={() => setWorkOrderToViewNotes(workOrder)}
                                                    >
                                                        <NotesRounded />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title='View photos and attachments'>
                                                    <IconButton
                                                        aria-label={`View photos and attachments for ${workOrder.title}`}
                                                        onClick={() => setWorkOrderToViewAttachments(workOrder)}
                                                    >
                                                        <AttachFileRounded />
                                                    </IconButton>
                                                </Tooltip>

                                                {workOrder.status === 'Draft' && (
                                                    <Tooltip title='Edit draft work order'>
                                                        <IconButton
                                                            aria-label={`Edit ${workOrder.title}`}
                                                            onClick={() => openEditDialog(workOrder)}
                                                        >
                                                            <EditRounded />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}

                                                {(workOrder.status === 'Draft' || workOrder.status === 'Scheduled') && (
                                                    <Tooltip title={
                                                        workOrder.status === 'Scheduled'
                                                            ? 'Reschedule Work Order'
                                                            : 'Schedule Work Order'
                                                    }>
                                                        <IconButton
                                                            aria-label={`Schedule ${workOrder.title}`}
                                                            onClick={() => openScheduleDialog(workOrder)}
                                                            color="primary"
                                                        >
                                                            <EventRounded />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}

                                                {workOrder.status === 'Scheduled' && (
                                                    <Tooltip title='Manage Technician Assignments'>
                                                        <IconButton
                                                            aria-label={`Manage technician assignments for ${workOrder.title}`}
                                                            color='secondary'
                                                            onClick={() => openAssignmentDialog(workOrder)}
                                                        >
                                                            <GroupAddRounded />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Stack>
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
                        {totalCount} work order{totalCount === 1 ? '' : 's'}
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

            <ScheduleWorkOrderDialog
                onClose={() => setWorkOrderToSchedule(null)}
                onScheduled={handleWorkOrderSaved}
                open={workOrderToSchedule !== null}
                workOrder={workOrderToSchedule}
            />

            <WorkOrderAssignmentsDialog
                onClose={() => setWorkOrderToAssign(null)}
                open={workOrderToAssign !== null}
                workOrder={workOrderToAssign}
            />

            <WorkOrderNotesDialog
                onClose={() => setWorkOrderToViewNotes(null)}
                open={workOrderToViewNotes !== null}
                workOrder={workOrderToViewNotes}
            />

            <WorkOrderAttachmentsDialog
                onClose={() => setWorkOrderToViewAttachments(null)}
                open={workOrderToViewAttachments !== null}
                workOrder={workOrderToViewAttachments}
            />
        </>
    );
}