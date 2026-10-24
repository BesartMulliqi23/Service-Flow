import { Alert, Box, Chip, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { useAuth } from "../features/auth/AuthContext";
import { AssignmentTurnedIn, BuildCircleRounded, CheckCircleRounded, PlayCircleRounded, ScheduleRounded } from "@mui/icons-material";
import { useEffect, useState, type ReactNode } from "react";
import { getDashboardSummary, type DashboardSummary } from "../features/dashboard/dashboardApi";

function formatNumber(value: number) {
    return new Intl.NumberFormat().format(value);
}

function formatCost(value: number) {
    return value.toFixed(2);
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

                    <Paper
                        sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            p: { xs: 2.5, md: 3 }
                        }}
                    >
                        <Stack spacing={1}>
                            <Typography component='h2' variant="h6" sx={{ fontWeight: 700 }}>
                                Work order review
                            </Typography>

                            <Typography color="text.secondary" variant="body2">
                                Current counts across all Work Orders in your organization.
                            </Typography>

                            <Stack direction='row' sx={{ flexWrap: 'wrap', gap: 1, pt: 1 }}>
                                <Chip
                                    label={`Draf: ${formatNumber(summary.draftWorkOrderCount)}`}
                                    variant="outlined"
                                />

                                <Chip
                                    color="primary"
                                    label={`Scheduled: ${formatNumber(summary.scheduledWorkOrderCount)}`}
                                    variant="outlined"
                                />

                                <Chip
                                    color="warning"
                                    label={`In progress: ${formatNumber(summary.inProgressWorkOrderCount)}`}
                                    variant="outlined"
                                />

                                <Chip
                                    color="success"
                                    label={`Completed: ${formatNumber(summary.completedWorkOrderCount)}`}
                                    variant="outlined"
                                />

                                <Chip
                                    label={`Cancelled: ${formatNumber(summary.cancelledWorkOrderCount)}`}
                                    variant="outlined"
                                />
                            </Stack>
                        </Stack>
                    </Paper>
                </>
            ) : null}
        </Stack>
    );
}

function OperationalWorkspaceHome() {
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
                    <AssignmentTurnedIn color="primary" />

                    <Typography variant="h6">
                        Operational workspace
                    </Typography>

                    <Typography color="text.secondary">
                        Use the navigation above to view schedules, manage Work Orders,
                        or complete assigned jobs.
                    </Typography>

                    <Stack direction='row' sx={{ flexWrap: 'wrap', gap: 1 }}>
                        {user?.roles.map(r => (
                            <Chip key={r} label={r} size="small" />
                        ))}
                    </Stack>
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