import { useEffect, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { getTechnicianWorkOrders, type TechnicianWorkOrder } from "../features/technicianWorkOrders/technicianWorkOrderApi";
import type { WorkOrderPriority, WorkOrderStatus } from "../features/workOrders/workOrderApi";
import { Navigate } from "react-router";
import { Alert, Box, Chip, CircularProgress, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Typography } from "@mui/material";

const technicianJobStatuses: WorkOrderStatus[] = ['Scheduled', 'InProgress', 'Completed'];

function getPriorityColor(priority: WorkOrderPriority) {
    switch (priority) {
        case 'Urgent':
            return 'error';
        case 'High':
            return 'warning';
        case 'Normal':
            return 'primary';
        case 'Low':
            return 'default';
    }
}

function getStatusColor(status: WorkOrderStatus) {
    switch (status) {
        case 'Scheduled':
            return 'primary';
        case 'InProgress':
            return 'warning';
        case 'Completed':
            return 'success';
        case 'Cancelled':
            return 'error';
        case 'Draft':
            return 'default';
    }
}

function formatStatus(status: WorkOrderStatus) {
    return status === 'InProgress' ? 'In progress' : status;
}

function formatSchedule(workOrder: TechnicianWorkOrder) {
    if (!workOrder.scheduledStartUtc || !workOrder.scheduledEndUtc) {
        return 'Schedule not available';
    }

    const formatter = new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    return `${formatter.format(new Date(workOrder.scheduledStartUtc))} – ${formatter.format(new Date(workOrder.scheduledEndUtc))}`;
}

function formatAddress(workOrder: TechnicianWorkOrder) {
    return [
        workOrder.addressLine1,
        workOrder.addressLine2,
        workOrder.city,
        workOrder.postalCode,
        workOrder.country,
    ]
        .filter(Boolean)
        .join(', ');
}

export function MyJobsPage() {
    const { user } = useAuth();

    const [workOrders, setWorkOrders] = useState<TechnicianWorkOrder[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<WorkOrderStatus | ''>('');
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const canExecuteAssignedWork = user?.roles.includes('Technician') ?? false;

    useEffect(() => {
        let isCurrentRequest = true;

        async function loadWorkOrders() {
            setIsLoading(true);
            setErrorMessage(null);

            try {
                const response = await getTechnicianWorkOrders(selectedStatus || undefined);

                if (isCurrentRequest) {
                    setWorkOrders(response);
                }
            } catch {
                if (isCurrentRequest) {
                    setErrorMessage('Unable to load your assigned jobs. Please try again in a moment.');
                }
            } finally {
                if (isCurrentRequest) {
                    setIsLoading(false);
                }
            }
        }

        void loadWorkOrders();

        return () => {
            isCurrentRequest = false;
        };
    }, [selectedStatus]);

    if (!canExecuteAssignedWork) {
        return <Navigate to='/app' replace />
    }

    return (
        <Stack spacing={3}>
            <Box>
                <Typography component='h1' variant='h4' sx={{ fontWeight: 700 }}>
                    My jobs
                </Typography>

                <Typography color='text.secondary' sx={{ mt: 0.5 }}>
                    View and complete the work orders assigned to you.
                </Typography>
            </Box>

            <Paper sx={{ p: 2 }}>
                <FormControl
                    size="small"
                    sx={{ minWidth: { xs: '100%', sm: 220 } }}
                >
                    <InputLabel id='my-jobs-status-filter-label'>
                        Status
                    </InputLabel>

                    <Select
                        label='Status'
                        labelId='my-jobs-status-filter-label'
                        onChange={e => setSelectedStatus(e.target.value)}
                        value={selectedStatus}
                    >
                        <MenuItem value=''>
                            <em>All assigned jobs</em>
                        </MenuItem>

                        {technicianJobStatuses.map(status => (
                            <MenuItem key={status} value={status}>
                                {formatStatus(status)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
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
                    <CircularProgress aria-label="Loading assigned jobs" />
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
                    <Typography sx={{ fontWeight: 600 }} variant="h6">
                        No assigned jobs found
                    </Typography>

                    <Typography color='text.secondary' sx={{ mt: 1 }}>
                        Assigned work orders will appear here when they are ready for you.
                    </Typography>
                </Paper>
            ) : (
                <Stack spacing={2}>
                    {workOrders.map(workOrder => (
                        <Paper
                            key={workOrder.id}
                            sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                p: { xs: 2, sm: 3 }
                            }}
                        >
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
                                            variant="h6"
                                            sx={{ fontWeight: 700 }}
                                        >
                                            {workOrder.title}
                                        </Typography>

                                        <Typography
                                            color='text.secondary'
                                            variant="body2"
                                        >
                                            {workOrder.customerName} —{' '}
                                            {workOrder.serviceLocationName}
                                        </Typography>
                                    </Box>

                                    <Stack direction='row' spacing={1}>
                                        <Chip 
                                            color={getStatusColor(workOrder.status)}
                                            label={formatStatus(workOrder.status)}
                                            size="small"
                                        />

                                        <Chip 
                                            color={getPriorityColor(workOrder.priority)}
                                            label={workOrder.priority}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Stack>
                                </Stack>

                                <Box>
                                    <Typography
                                        color="text.secondary"
                                        variant='overline'
                                    >
                                        Schedule
                                    </Typography>

                                    <Typography>
                                        {formatSchedule(workOrder)}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography
                                        color="text.secondary"
                                        variant='overline'
                                    >
                                        Service location
                                    </Typography>

                                    <Typography>
                                        {formatAddress(workOrder)}
                                    </Typography>
                                </Box>

                                <Typography
                                    color="text.secondary"
                                    sx={{
                                        display: '-webkit-box',
                                        overflow: 'hidden',
                                        WebkitBoxOrient: 'vertical',
                                        WebkitLineClamp: 2
                                    }}
                                >
                                    {workOrder.description}
                                </Typography>
                            </Stack>
                        </Paper>
                    ))}
                </Stack>
            )}
        </Stack>
    );
}