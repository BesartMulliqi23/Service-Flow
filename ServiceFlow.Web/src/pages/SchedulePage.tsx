import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { getCalendarWorkOrders, type CalendarWorkOrder } from "../features/calendar/calendarApi";
import { addDays, formatDayName, formatDayNumber, formatTime, formatWeekRange, getWeekDays, getWeekStart, isSameLocalDay, overlapsDay } from "../features/calendar/calendarDateUtils";
import { Navigate } from "react-router";
import { Alert, Box, Button, Chip, CircularProgress, IconButton, Paper, Stack, Typography } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";

const permittedRoles = ['Owner', 'Manager', 'Dispatcher'];

function getPriorityColor(priority: CalendarWorkOrder['priority']) {
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

function getStatusColor(status: CalendarWorkOrder['status']) {
    return status === 'InProgress' ? 'warning' : 'primary';
}

export function SchedulePage() {
    const { user } = useAuth();

    const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
    const [workOrders, setWorkOrders] = useState<CalendarWorkOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const canViewSchedule = user?.roles.some(role => permittedRoles.includes(role)) ?? false;

    const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

    useEffect(() => {
        let isCurrentRequest = true;

        async function loadCalendar() {
            setIsLoading(true);
            setErrorMessage(null);

            try {
                const response = await getCalendarWorkOrders({
                    fromUtc: weekStart,
                    toUtc: addDays(weekStart, 7)
                });

                if (isCurrentRequest) {
                    setWorkOrders(response);
                }
            } catch {
                if (isCurrentRequest) {
                    setErrorMessage('Unable to load the schedule. Please try again in a moment.');
                }
            } finally {
                if (isCurrentRequest) {
                    setIsLoading(false);
                }
            }
        }

        void loadCalendar();

        return () => {
            isCurrentRequest = false
        };
    }, [weekStart]);

    if (!canViewSchedule) {
        return <Navigate to='/app' replace />
    }

    function showPreviousWeek() {
        setWeekStart(currentWeekStart => addDays(currentWeekStart, -7));
    }

    function showNextWeek() {
        setWeekStart(currentWeekStart => addDays(currentWeekStart, 7));
    }

    function showCurrentWeek() {
        setWeekStart(getWeekStart(new Date()));
    }

    return (
        <Stack spacing={3}>
            <Box>
                <Typography component='h1' variant="h4" sx={{ fontWeight: 700 }}>
                    Schedule
                </Typography>

                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    View scheduled and in-progress work orders for your organization.
                </Typography>
            </Box>

            <Paper sx={{ p: 2 }}>
                <Stack
                    spacing={2}
                    sx={{
                        alignItems: { xs: 'stretch', sm: 'center' },
                        direction: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between'
                    }}
                >
                    <Stack spacing={0.5} direction='row' sx={{ alignItems: 'center' }}>
                        <IconButton
                            aria-label="Show previous week"
                            onClick={showPreviousWeek}
                        >
                            <ChevronLeft />
                        </IconButton>

                        <Typography
                            align="center"
                            component='h2'
                            sx={{ fontWeight: 600, minWidth: { sm: 210 } }}
                        >
                            {formatWeekRange(weekStart)}
                        </Typography>

                        <IconButton
                            aria-label="Show next week"
                            onClick={showNextWeek}
                        >
                            <ChevronRight />
                        </IconButton>
                    </Stack>

                    <Button onClick={showCurrentWeek} variant="outlined">
                        Today
                    </Button>
                </Stack>
            </Paper>

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress aria-label="Loading schedule" />
                </Box>
            ) : (
                <Box sx={{ overflowX: 'auto', pb: 1 }}>
                    <Box
                        sx={{
                            display: 'grid',
                            gap: 1,
                            gridTemplateColumns: 'repeat(7, minmax(220px, 1fr))',
                            minWidth: 1540
                        }}
                    >
                        {weekDays.map(day => {
                            const isToday = isSameLocalDay(day, new Date());

                            const dayWorkOrders = workOrders.filter(workOrder =>
                                overlapsDay(
                                    workOrder.scheduledStartUtc,
                                    workOrder.scheduledEndUtc,
                                    day
                                )
                            );

                            return (
                                <Paper
                                    key={day.toISOString()}
                                    sx={{
                                        bgcolor: isToday ? 'action.hover' : 'background.default',
                                        minHeight: 360,
                                        overflow: 'hidden'
                                    }}
                                    variant="outlined"
                                >
                                    <Box
                                        sx={{
                                            alignItems: 'center',
                                            borderBottom: 1,
                                            borderColor: 'divider',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            px: 1.5,
                                            py: 1
                                        }}
                                    >
                                        <Typography sx={{ fontWeight: 600 }}>
                                            {formatDayName(day)}
                                        </Typography>

                                        <Chip
                                            color={isToday ? 'primary' : 'default'}
                                            size="small"
                                            label={formatDayNumber(day)}
                                        />
                                    </Box>

                                    <Stack spacing={1} sx={{ p: 1 }}>
                                        {dayWorkOrders.length === 0 ? (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ pt: 1 }}
                                            >
                                                No scheduled work orders.
                                            </Typography>
                                        ) : (
                                            dayWorkOrders.map(workOrder => (
                                                <Paper
                                                    key={workOrder.id}
                                                    sx={{ p: 1.25 }}
                                                    variant="outlined"
                                                >
                                                    <Stack spacing={1}>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{ fontWeight: 600 }}
                                                        >
                                                            {workOrder.title}
                                                        </Typography>

                                                        <Typography
                                                            color="text.secondary"
                                                            variant="caption"
                                                        >
                                                            {formatTime(workOrder.scheduledStartUtc)} -{' '}
                                                            {formatTime(workOrder.scheduledEndUtc)}
                                                        </Typography>

                                                        <Typography
                                                            color="text.secondary"
                                                            variant="caption"
                                                        >
                                                            {workOrder.customerName}
                                                        </Typography>

                                                        <Typography
                                                            color="text.secondary"
                                                            variant="caption"
                                                        >
                                                            {workOrder.serviceLocationName}
                                                        </Typography>

                                                        <Stack
                                                            direction="row"
                                                            sx={{ flexWrap: 'wrap', gap: 0.5 }}
                                                        >
                                                            <Chip
                                                                color={getStatusColor(workOrder.status)}
                                                                label={
                                                                    workOrder.status === 'InProgress'
                                                                        ? 'In Progress'
                                                                        : 'Scheduled'
                                                                }
                                                                size="small"
                                                            />

                                                            <Chip
                                                                color={getPriorityColor(workOrder.priority)}
                                                                label={workOrder.priority}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        </Stack>

                                                        <Typography color="text.secondary" variant="caption">
                                                            {workOrder.technicians.length > 0 ? (
                                                                workOrder.technicians
                                                                    .map(t => t.displayName).join(', ')
                                                            ) : (
                                                                'No technician assigned'
                                                            )}
                                                        </Typography>
                                                    </Stack>
                                                </Paper>
                                            ))
                                        )}
                                    </Stack>
                                </Paper>
                            );
                        })}
                    </Box>
                </Box>
            )}
        </Stack>
    );
}