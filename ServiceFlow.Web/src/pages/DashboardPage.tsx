import { Alert, Box, Button, Chip, CircularProgress, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import { useAuth } from "../features/auth/AuthContext";
import { AssignmentRounded, AssignmentTurnedIn, BuildCircleRounded, CalendarMonthRounded, CheckCircleRounded, PlayCircleRounded, ScheduleRounded } from "@mui/icons-material";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getDashboardSummary, type DashboardSummary, type DashboardUpcomingWorkOrder } from "../features/dashboard/dashboardApi";
import { Link } from "react-router";

function formatNumber(value: number) {
    return new Intl.NumberFormat().format(value);
}

function formatCost(value: number) {
    return value.toFixed(2);
}

function formatScheduleRange(scheduledStartUtc: string, scheduledEndUtc: string) {
    const start = new Date(scheduledStartUtc);
    const end = new Date(scheduledEndUtc);

    const dateFormatter = new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });

    const timeFormatter = new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit'
    });

    return `${dateFormatter.format(start)} · ${timeFormatter.format(start)} – ${timeFormatter.format(end)} `;
}

export function DashboardPage() {
    const { user } = useAuth();

    const canViewReports = user?.roles.some(role => ['Owner', 'Manager'].includes(role)) ?? false;

    if (!canViewReports) {
        return <OperationalWorkspaceHome />;
    }

    return <ReportingDashboard />;
}

function ReportingDashboard() {
    const { user } = useAuth();

    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        let isCurrentRequest = true;

        async function loadDashboard() {
            setIsLoading(true);
            setErrorMessage(null);

            try {
                const response = await getDashboardSummary();

                if (isCurrentRequest) {
                    setSummary(response);
                }
            } catch {
                if (isCurrentRequest) {
                    setErrorMessage('Unable to load the operational dashboard. Please try again in a moment.');
                }
            } finally {
                if (isCurrentRequest) {
                    setIsLoading(false);
                }
            }
        }

        void loadDashboard();

        return () => {
            isCurrentRequest = false;
        };
    }, []);

    return (
        <Stack spacing={4}>
            <Stack spacing={1}>
                <Typography component='h1' variant="h4">
                    Welcome back, {user?.displayName}
                </Typography>

                <Typography color="text.secondary">
                    Here is the current operational picture for your organization.
                </Typography>
            </Stack>

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            {isLoading ? (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        py: 8
                    }}
                >
                    <CircularProgress aria-label="Loading operational dashboard" />
                </Box>
            ) : summary ? (
                <>
                    <Box
                        sx={{
                            display: 'grid',
                            gap: 2,
                            gridTemplateColumns: {
                                xs: '1fr',
                                sm: 'repeat(2, minmax(0, 1fr))',
                                lg: 'repeat(4, minmax(0, 1fr))'
                            }
                        }}
                    >
                        <DashboardMetricCard
                            icon={<ScheduleRounded color="primary" />}
                            label='Scheduled work'
                            value={formatNumber(summary.scheduledWorkOrderCount)}
                        />

                        <DashboardMetricCard
                            icon={<PlayCircleRounded color="warning" />}
                            label='In progress'
                            value={formatNumber(summary.inProgressWorkOrderCount)}
                        />

                        <DashboardMetricCard
                            icon={<CheckCircleRounded color="success" />}
                            label='Completed in 30 days'
                            value={formatNumber(summary.completedWorkOrdersLast30Days)}
                        />

                        <DashboardMetricCard
                            icon={<BuildCircleRounded color="secondary" />}
                            label='Material cost in 30 days'
                            value={formatCost(summary.materialCostRecordedLast30Days)}
                        />
                    </Box>

                    <Box
                        sx={{
                            display: 'grid',
                            gap: 2,
                            gridTemplateColumns: {
                                xs: '1fr',
                                lg: 'minmax(0, 1fr) minmax(0, 1.25fr)'
                            }
                        }}
                    >
                        <WorkOrderStatusBreakdown summary={summary} />

                        <UpcomingWorkOrders workOrders={summary.upcomingWorkOrders} />
                    </Box>
                </>
            ) : null}
        </Stack>
    );
}

function WorkOrderStatusBreakdown({ summary }: { summary: DashboardSummary }) {
    const statusItems = useMemo(
        () => [
            {
                color: 'text.secondary',
                count: summary.draftWorkOrderCount,
                label: 'Draft'
            },
            {
                color: 'primary.main',
                count: summary.scheduledWorkOrderCount,
                label: 'Scheduled'
            },
            {
                color: 'warning.main',
                count: summary.inProgressWorkOrderCount,
                label: 'In progress'
            },
            {
                color: 'success.main',
                count: summary.completedWorkOrderCount,
                label: 'Completed'
            },
            {
                color: 'action.disabled',
                count: summary.cancelledWorkOrderCount,
                label: 'Cancelled'
            }
        ],
        [summary]
    );

    const totalWorkOrders = statusItems.reduce(
        (total, item) => total + item.count,
        0
    );

    return (
        <Paper
            sx={{
                border: '1px solid',
                borderColor: 'divider',
                p: { xs: 2.5, md: 3 }
            }}
        >
            <Stack spacing={2.25}>
                <Stack spacing={0.5}>
                    <Typography component='h2' variant="h6" sx={{ fontWeight: 700 }}>
                        Work order status
                    </Typography>

                    <Typography color="text.secondary" variant="body2">
                        Current Work Order distribution across your organization.
                    </Typography>
                </Stack>

                {statusItems.map(item => {
                    const percentage = totalWorkOrders === 0
                        ? 0
                        : (item.count / totalWorkOrders) * 100;

                    return (
                        <Stack key={item.label} spacing={0.75}>
                            <Stack
                                direction='row'
                                sx={{
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <Typography variant="body2">
                                    {item.label}
                                </Typography>

                                <Typography color="text.secondary" variant="body2">
                                    {formatNumber(item.count)}
                                </Typography>
                            </Stack>

                            <LinearProgress
                                aria-label={`${item.label}: ${item.count}`}
                                value={percentage}
                                variant="determinate"
                                sx={{
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: item.color
                                    }
                                }}
                            />
                        </Stack>
                    );
                })}
            </Stack>
        </Paper>
    );
}

function UpcomingWorkOrders({ workOrders }: { workOrders: DashboardUpcomingWorkOrder[] }) {
    return (
        <Paper
            sx={{
                border: '1px solid',
                borderColor: 'divider',
                p: { xs: 2.5, md: 3 }
            }}
        >
            <Stack spacing={2.25}>
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    sx={{
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        justifyContent: 'space-between'
                    }}
                >
                    <Box>
                        <Typography component='h2' variant="h6" sx={{ fontWeight: 700 }}>
                            Upcoming scheduled work
                        </Typography>

                        <Typography color="text.secondary" variant="body2">
                            The next seven days, limited to the next five Work Orders.
                        </Typography>
                    </Box>

                    <Button
                        component={Link}
                        to='/app/schedule'
                        size="small"
                    >
                        View schedule
                    </Button>
                </Stack>

                {workOrders.length === 0 ? (
                    <Typography color="text.secondary">
                        No Work Orders are scheduled in the next seven days.
                    </Typography>
                ) : (
                    <Stack spacing={1.25}>
                        {workOrders.map(workOrder => (
                            <UpcomingWorkOrderRow
                                key={workOrder.id}
                                workOrder={workOrder}
                            />
                        ))}
                    </Stack>
                )}
            </Stack>
        </Paper>
    );
}

function UpcomingWorkOrderRow({ workOrder }: { workOrder: DashboardUpcomingWorkOrder }) {
    return (
        <Box
            sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 1.5
            }}
        >
            <Stack spacing={0.75}>
                <Stack
                    direction='row'
                    sx={{
                        alignItems: 'flex-start',
                        gap: 1,
                        justifyContent: 'space-between'
                    }}
                >
                    <Typography sx={{ fontWeight: 600 }}>
                        {workOrder.title}
                    </Typography>

                    <Chip
                        label={workOrder.priority}
                        size="small"
                        variant="outlined"
                    />
                </Stack>

                <Typography color="text.secondary" variant="body2">
                    {formatScheduleRange(workOrder.scheduledStartUtc, workOrder.scheduledEndUtc)}
                </Typography>

                <Typography color="text.secondary" variant="body2">
                    {workOrder.customerName} · {workOrder.serviceLocationName}
                </Typography>

                <Typography color="text.secondary" variant="caption">
                    {workOrder.technicianNames.length > 0
                        ? workOrder.technicianNames.join(', ')
                        : 'No technician assigned'}
                </Typography>
            </Stack>
        </Box>
    );
}

function OperationalWorkspaceHome() {
    const { user } = useAuth();

    const isDispatcher = user?.roles.includes('Dispatcher') ?? false;
    const isTechnician = user?.roles.includes('Technician') ?? false;

    if (isDispatcher) {
        return (
            <RoleWorkspaceHome
                actions={
                    <>
                        <Button
                            component={Link}
                            to='/app/schedule'
                            startIcon={<CalendarMonthRounded />}
                            variant="contained"
                        >
                            Open schedule
                        </Button>

                        <Button
                            component={Link}
                            to='/app/work-orders'
                            startIcon={<AssignmentRounded />}
                            variant="contained"
                        >
                            Manage Work Orders
                        </Button>
                    </>
                }
                description='Coordinate upcoming jobs, technician assignments, and customer work from the schedule and Work Order screens.'
                icon={<CalendarMonthRounded color="primary" />}
                title='Dispatcher workspace'
            />
        );
    }

    if (isTechnician) {
        return (
            <RoleWorkspaceHome
                actions={
                    <Button
                        component={Link}
                        to='/app/my-jobs'
                        startIcon={<AssignmentRounded />}
                        variant="contained"
                    >
                        View my jobs
                    </Button>
                }
                description='Review your assigned Work Orders, record materials used, and complete work in the field.'
                icon={<AssignmentTurnedIn color="primary" />}
                title='Technician workspace'
            />
        );
    }

    return (
        <RoleWorkspaceHome
            actions={null}
            description='Use the navigation above to access your ServiceFlow workspace.'
            icon={<AssignmentTurnedIn color="primary" />}
            title='Operational workspace'
        />
    );
}

type RoleWorkspaceHomeProps = {
    actions: ReactNode,
    description: string,
    icon: ReactNode,
    title: string
};

function RoleWorkspaceHome({
    actions,
    description,
    icon,
    title
}: RoleWorkspaceHomeProps) {
    const { user } = useAuth();

    return (
        <Stack spacing={4}>
            <Stack spacing={1}>
                <Typography component='h1' variant="h4">
                    Welcome back, {user?.displayName}
                </Typography>

                <Typography color="text.secondary">
                    Your ServiceFlow workspace is ready for today's operational work.
                </Typography>
            </Stack>

            <Paper
                sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    p: { xs: 3, md: 4 }
                }}
            >
                <Stack spacing={2}>
                    {icon}

                    <Typography variant="h6">
                        {title}
                    </Typography>

                    <Typography color="text.secondary">
                        {description}
                    </Typography>

                    <Stack direction='row' sx={{ flexWrap: 'wrap', gap: 1 }}>
                        {user?.roles.map(r => (
                            <Chip key={r} label={r} size="small" />
                        ))}
                    </Stack>

                    {actions && (
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={1}
                        >
                            {actions}
                        </Stack>
                    )}
                </Stack>
            </Paper>
        </Stack>
    );
}

type DashboardMetricCardProps = {
    icon: ReactNode,
    label: string,
    value: string
};

function DashboardMetricCard({
    icon,
    label,
    value
}: DashboardMetricCardProps) {
    return (
        <Paper
            sx={{
                border: '1px solid',
                borderColor: 'divider',
                minWidth: 0,
                p: 2.5
            }}
        >
            <Stack spacing={1.5}>
                {icon}

                <Typography color="text.secondary" variant="body2">
                    {label}
                </Typography>

                <Typography component='p' sx={{ fontWeight: 700 }} variant="h4">
                    {value}
                </Typography>
            </Stack>
        </Paper>
    );
}