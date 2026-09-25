import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { getCalendarWorkOrders, type CalendarWorkOrder } from "../features/calendar/calendarApi";
import { addDays, formatDayName, formatDayNumber, formatTime, formatWeekRange, getWeekDays, getWeekStart, isSameLocalDay, overlapsDay } from "../features/calendar/calendarDateUtils";
import { Navigate } from "react-router";
import { Alert, Box, Button, ButtonBase, Chip, CircularProgress, Divider, Drawer, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Stack, Typography } from "@mui/material";
import { ChevronLeft, ChevronRight, Close } from "@mui/icons-material";
import { getTechnicians, type Technician } from "../features/technicians/techniciansApi";

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

function getStatusLablel(status: CalendarWorkOrder['status']) {
    return status === 'InProgress' ? 'In progress' : 'Scheduled';
}

export function SchedulePage() {
    const { user } = useAuth();

    const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
    const [workOrders, setWorkOrders] = useState<CalendarWorkOrder[]>([]);
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
    const [selectedWorkOrder, setSelectedWorkOrder] = useState<CalendarWorkOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const canViewSchedule = user?.roles.some(role => permittedRoles.includes(role)) ?? false;

    const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

    useEffect(() => {
        let isCurrentRequest = true;

        async function loadTechnicians() {
            setIsLoadingTechnicians(true);

            try {
                const response = await getTechnicians();

                if (isCurrentRequest) {
                    setTechnicians(response);
                }
            } catch {
                if (isCurrentRequest) {
                    setErrorMessage('Unable to load the technician directory. Please refresh the page and try again.');
                }
            } finally {
                if (isCurrentRequest) {
                    setIsLoadingTechnicians(false);
                }
            }
        }

        void loadTechnicians();

        return () => {
            isCurrentRequest = false;
        }
    }, []);

    useEffect(() => {
        let isCurrentRequest = true;

        async function loadCalendar() {
            setIsLoading(true);
            setErrorMessage(null);

            try {
                const response = await getCalendarWorkOrders({
                    fromUtc: weekStart,
                    toUtc: addDays(weekStart, 7),
                    technicianId: selectedTechnicianId || undefined
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
    }, [weekStart, selectedTechnicianId]);

    useEffect(() => {
        if (selectedWorkOrder && !workOrders.some(workOrder => workOrder.id === selectedWorkOrder.id)) {
            setSelectedWorkOrder(null);
        }
    }, [selectedWorkOrder, workOrders]);

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
        <>
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

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                            <FormControl
                                disabled={isLoadingTechnicians}
                                size="small"
                                sx={{ minWidth: 220 }}
                            >
                                <InputLabel id="technician-filter-label">
                                    Technician
                                </InputLabel>

                                <Select
                                    label="Technician"
                                    labelId="technician-filter-label"
                                    onChange={e => setSelectedTechnicianId(e.target.value)}
                                    value={selectedTechnicianId}
                                >
                                    <MenuItem value="">
                                        <em>All technicians</em>
                                    </MenuItem>

                                    {technicians.map(t => (
                                        <MenuItem key={t.id} value={t.id}>
                                            {t.displayName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Button onClick={showCurrentWeek} variant="outlined">
                                Today
                            </Button>
                        </Stack>
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
                                                    <ButtonBase
                                                        key={workOrder.id}
                                                        onClick={() => setSelectedWorkOrder(workOrder)}
                                                        sx={{
                                                            borderRadius: 1,
                                                            display: 'block',
                                                            textAlign: 'left',
                                                            width: '100%'
                                                        }}
                                                    >
                                                        <Paper
                                                            sx={{
                                                                p: 1.25,
                                                                transition: 'border-color 150ms ease, box-shadow 150ms ease',
                                                                '&:hover': {
                                                                    borderColor: 'primary.main',
                                                                    boxShadow: 2
                                                                }
                                                            }}
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
                                                                    {formatTime(workOrder.scheduledStartUtc)}{' '}-{' '}
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
                                                                        label={getStatusLablel(workOrder.status)}
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
                                                    </ButtonBase>
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

            <Drawer
                anchor="right"
                onClose={() => setSelectedWorkOrder(null)}
                open={selectedWorkOrder !== null}
            >
                {selectedWorkOrder && (
                    <Box sx={{ p: 3, width: { xs: '100vw', sm: 420 } }}>
                        <Stack spacing={3}>
                            <Stack
                                spacing={2}
                                direction='row'
                                sx={{
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <Box>
                                    <Typography
                                        component='h2'
                                        variant="h5"
                                        sx={{ fontWeight: 700 }}
                                    >
                                        {selectedWorkOrder.title}
                                    </Typography>

                                    <Typography
                                        color="text.secondary"
                                        sx={{ mt: 0.5 }}
                                        variant="body2"
                                    >
                                        Work-order schedule details
                                    </Typography>
                                </Box>

                                <IconButton
                                    aria-label="Close work order details"
                                    onClick={() => setSelectedWorkOrder(null)}
                                >
                                    <Close />
                                </IconButton>
                            </Stack>

                            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                                <Chip 
                                    color={getStatusColor(selectedWorkOrder.status)}
                                    label={getStatusLablel(selectedWorkOrder.status)}
                                />

                                <Chip 
                                    color={getPriorityColor(selectedWorkOrder.priority)}
                                    label={`${selectedWorkOrder.priority} priority`}
                                    variant="outlined"
                                />
                            </Stack>

                            <Divider />

                            <Box>
                                <Typography variant="overline" color="text.secondary">
                                    Schedule
                                </Typography>

                                <Typography>
                                    {formatTime(selectedWorkOrder.scheduledStartUtc)} -{' '}
                                    {formatTime(selectedWorkOrder.scheduledEndUtc)}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="overline" color="text.secondary">
                                    Customer
                                </Typography>

                                <Typography>{selectedWorkOrder.customerName}</Typography>
                            </Box>

                            <Box>
                                <Typography variant="overline" color="text.secondary">
                                    Service location
                                </Typography>

                                <Typography>{selectedWorkOrder.serviceLocationName}</Typography>
                            </Box>

                            <Box>
                                <Typography variant="overline" color="text.secondary">
                                    Assigned technicians
                                </Typography>

                                {selectedWorkOrder.technicians.length > 0 ? (
                                    <Stack spacing={0.5}>
                                        {selectedWorkOrder.technicians.map(t => (
                                            <Typography key={t.id}>
                                                {t.displayName}
                                            </Typography>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Typography color="text.secondary">
                                        No technician has been assigned.
                                    </Typography>
                                )}
                            </Box>
                        </Stack>
                    </Box>
                )}
            </Drawer>
        </>
    );
}