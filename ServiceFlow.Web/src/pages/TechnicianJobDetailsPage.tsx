import { Link, Navigate, useParams } from "react-router";
import { useAuth } from "../features/auth/AuthContext";
import { getTechnicianWorkOrder, startTechnicianWorkOrder, type TechnicianWorkOrder } from "../features/technicianWorkOrders/technicianWorkOrderApi";
import type { WorkOrderPriority, WorkOrderStatus } from "../features/workOrders/workOrderApi";
import { useEffect, useState } from "react";
import { ApiError } from "../api/apiClient";
import { Alert, Box, Button, Chip, CircularProgress, Divider, Paper, Stack, Typography } from "@mui/material";
import { ArrowBackRounded, PlayArrowRounded } from "@mui/icons-material";
import { CompleteWorkOrderDialog } from "../features/technicianWorkOrders/CompleteWorkOrderDialog";
import { WorkOrderMaterialsSection } from "../features/technicianMaterials/WorkOrderMaterialsSection";

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

function formatDateTime(value: string | null) {
    if (!value) {
        return '—';
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(new Date(value));
}

function formatAddress(workOrder: TechnicianWorkOrder) {
    return [
        workOrder.addressLine1,
        workOrder.addressLine2,
        workOrder.city,
        workOrder.postalCode,
        workOrder.country
    ]
        .filter(Boolean)
        .join(', ');
}

export function TechnicianJobDetailsPage() {
    const { user } = useAuth();
    const { workOrderId } = useParams();

    const [workOrder, setWorkOrder] = useState<TechnicianWorkOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isStarting, setIsStarting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);

    const canExecuteAssignedWork = user?.roles.includes('Technician') ?? false;

    useEffect(() => {
        if (!workOrderId) {
            return;
        }

        const currentWorkOrderId = workOrderId;

        let isCurrentRequest = true;

        async function loadWorkOrder() {
            setIsLoading(true);
            setErrorMessage(null);

            try {
                const response = await getTechnicianWorkOrder(currentWorkOrderId);

                if (isCurrentRequest) {
                    setWorkOrder(response);
                }
            } catch (error) {
                if (!isCurrentRequest) {
                    return;
                }

                if (error instanceof ApiError && error.status === 404) {
                    setErrorMessage('This job was not found or is not assigned to you.');
                }
                else {
                    setErrorMessage('Unable to load this job. Please try again in a moment.');
                }
            } finally {
                if (isCurrentRequest) {
                    setIsLoading(false);
                }
            }
        }

        void loadWorkOrder();

        return () => {
            isCurrentRequest = false;
        };
    }, [workOrderId]);

    if (!canExecuteAssignedWork) {
        return <Navigate to='/app' replace />;
    }

    async function handleStart() {
        if (!workOrder) {
            return;
        }

        setIsStarting(true);
        setErrorMessage(null);

        try {
            const startedWorkOrder = await startTechnicianWorkOrder(workOrder.id);

            setWorkOrder(startedWorkOrder);
        } catch (error) {
            if (error instanceof ApiError) {
                setErrorMessage(error.message);
            }
            else {
                setErrorMessage('Unable to start the Work Order. Please try again.');
            }
        } finally {
            setIsStarting(false);
        }
    }

    return (
        <>
            <Stack spacing={3}>
                <Button
                    component={Link}
                    to='/app/my-jobs'
                    variant='text'
                    startIcon={<ArrowBackRounded />}
                    sx={{ alignSelf: 'flex-start' }}
                >
                    Back to my jobs
                </Button>

                {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

                {isLoading ? (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            py: 8
                        }}
                    >
                        <CircularProgress aria-label="Loading job details" />
                    </Box>
                ) : workOrder ? (
                    <>
                        <Paper
                            sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                p: { xs: 2, md: 3 }
                            }}
                        >
                            <Stack spacing={3}>
                                <Stack
                                    spacing={2}
                                    direction={{ xs: 'column', sm: 'row' }}
                                    sx={{
                                        alignItems: { xs: 'flex-start', sm: 'center' },
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <Box>
                                        <Typography component='h1' variant="h4" sx={{ fontWeight: 700 }}>
                                            {workOrder.title}
                                        </Typography>

                                        <Typography color='text.secondary' sx={{ mt: 0.5 }}>
                                            {workOrder.customerName} —{' '}
                                            {workOrder.serviceLocationName}
                                        </Typography>
                                    </Box>

                                    <Stack spacing={1} direction='row'>
                                        <Chip
                                            color={getStatusColor(workOrder.status)}
                                            label={formatStatus(workOrder.status)}
                                        />

                                        <Chip
                                            color={getPriorityColor(workOrder.priority)}
                                            label={workOrder.priority}
                                            variant="outlined"
                                        />
                                    </Stack>
                                </Stack>

                                <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                                    {workOrder.description}
                                </Typography>

                                <Stack
                                    direction={{ xs: 'column', sm: 'row' }}
                                    spacing={2}
                                >
                                    {workOrder.status === 'Scheduled' && (
                                        <Button
                                            color='primary'
                                            loading={isStarting}
                                            startIcon={<PlayArrowRounded />}
                                            onClick={() => void handleStart()}
                                            variant='contained'
                                        >
                                            Start work
                                        </Button>
                                    )}

                                    {workOrder.status === 'InProgress' && (
                                        <Button
                                            onClick={() => setIsCompleteDialogOpen(true)}
                                            color='success'
                                            variant="contained"
                                        >
                                            Complete work order
                                        </Button>
                                    )}
                                </Stack>
                            </Stack>
                        </Paper>

                        <Paper sx={{ p: { xs: 2, md: 3 } }}>
                            <Stack spacing={3}>
                                <Box>
                                    <Typography color='text.secondary' variant='overline'>
                                        Schedule
                                    </Typography>

                                    <Typography>
                                        {formatDateTime(workOrder.scheduledStartUtc)}{' '}–{' '}
                                        {formatDateTime(workOrder.scheduledEndUtc)}
                                    </Typography>
                                </Box>

                                <Divider />

                                <Box>
                                    <Typography color='text.secondary' variant='overline'>
                                        Service location
                                    </Typography>

                                    <Typography>
                                        {formatAddress(workOrder)}
                                    </Typography>
                                </Box>

                                {workOrder.accessInstructions && (
                                    <>
                                        <Divider />

                                        <Box>
                                            <Typography color='text.secondary' variant='overline'>
                                                Access instructions
                                            </Typography>

                                            <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                                                {workOrder.accessInstructions}
                                            </Typography>
                                        </Box>
                                    </>
                                )}

                                <Divider />

                                <Box>
                                    <Typography color='text.secondary' variant='overline'>
                                        Due date
                                    </Typography>

                                    <Typography>
                                        {formatDateTime(workOrder.dueUtc)}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>

                        {(workOrder.status === 'InProgress' || workOrder.status === 'Completed') && (
                            <WorkOrderMaterialsSection
                                canEdit={workOrder.status === 'InProgress'}
                                workOrderId={workOrder.id}
                            />
                        )}
                    </>
                ) : (
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 600 }} variant="h6">
                            Job unavailable
                        </Typography>

                        <Typography color='text.secondary' sx={{ mt: 1 }}>
                            This job may no longer be assigned to you.
                        </Typography>
                    </Paper>
                )}
            </Stack>

            <CompleteWorkOrderDialog
                onClose={() => setIsCompleteDialogOpen(false)}
                onCompleted={setWorkOrder}
                open={isCompleteDialogOpen}
                workOrder={workOrder}
            />
        </>
    );
}