import { useCallback, useEffect, useState } from "react";
import { getAuditLogs, type AuditEntityType, type AuditLogAction, type AuditLogEntry } from "../features/auditLogs/auditLogApi";
import { useAuth } from "../features/auth/AuthContext";
import { Navigate } from "react-router";
import { Alert, Box, CircularProgress, FormControl, InputLabel, MenuItem, Pagination, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";

const pageSize = 25;

const auditActions: AuditLogAction[] = [
    'CustomerCreated',
    'CustomerUpdated',
    'CustomerDeactivated',
    'ServiceLocationCreated',
    'ServiceLocationUpdated',
    'ServiceLocationDeactivated',
    'WorkOrderCreated',
    'WorkOrderUpdated',
    'WorkOrderScheduled',
    'WorkOrderRescheduled',
    'TechnicianAssigned',
    'TechnicianUnassigned',
    'WorkOrderStarted',
    'WorkOrderCompleted',
    'MaterialRecorded',
    'MaterialUpdated',
    'MaterialRemoved',
    'JobNoteAdded',
    'AttachmentUpload'
];

const entityTypes: AuditEntityType[] = [
    'Customer',
    'ServiceLocation',
    'WorkOrder',
    'WorkOrderMaterial',
    'WorkOrderNote',
    'WorkOrderAttachment'
];

function formatAction(action: AuditLogAction) {
    return action.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function formatEntityType(entityType: AuditEntityType) {
    return entityType.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(new Date(value));
}

function toStartOfLocalDayUtc(value: string) {
    if (!value) return undefined;

    const date = new Date(`${value}T00:00:00`);

    return date.toISOString();
}

function toEndOfLocalDayUtc(value: string) {
    if (!value) return undefined;

    const date = new Date(`${value}T23:59:59.999`);

    return date.toISOString();
}

export function ActivityPage() {
    const { user } = useAuth();

    const [entries, setEntries] = useState<AuditLogEntry[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    const [selectedAction, setSelectedAction] = useState<AuditLogAction | ''>('');
    const [selectedEntityType, setSelectedEntityType] = useState<AuditEntityType | ''>('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const canViewAuditLogs = user?.roles.some(role => ['Owner', 'Manager'].includes(role)) ?? false;

    const loadAuditLogs = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage(null);

        try {
            const response = await getAuditLogs({
                page,
                pageSize,
                action: selectedAction || undefined,
                entityType: selectedEntityType || undefined,
                fromUtc: toStartOfLocalDayUtc(fromDate),
                toUtc: toEndOfLocalDayUtc(toDate)
            });

            setEntries(response.items);
            setTotalPages(response.totalPages);
            setTotalCount(response.totalCount);
        } catch {
            setErrorMessage('Unable to load organization activity. Please try again in a moment.');
        } finally {
            setIsLoading(false);
        }
    }, [page, selectedAction, selectedEntityType, fromDate, toDate]);

    useEffect(() => {
        void loadAuditLogs();
    }, [loadAuditLogs]);

    if (!canViewAuditLogs) {
        return <Navigate to='/app' replace />;
    }

    function resetToFirstPage() {
        setPage(1);
    }

    return (
        <Stack spacing={3}>
            <Box>
                <Typography component='h1' variant="h4" sx={{ fontWeight: 700 }}>
                    Activity
                </Typography>

                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    Review important actions across your organization.
                </Typography>
            </Box>

            <Paper sx={{ p: 2 }}>
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                >
                    <FormControl size="small" sx={{ minWidth: 220 }}>
                        <InputLabel id='audit-action-label'>Action</InputLabel>

                        <Select
                            label='Action'
                            labelId="audit-action-label"
                            onChange={e => {
                                setSelectedAction(e.target.value as AuditLogAction | '');
                                resetToFirstPage();
                            }}
                            value={selectedAction}
                        >
                            <MenuItem value=''>
                                <em>All actions</em>
                            </MenuItem>

                            {auditActions.map(action => (
                                <MenuItem key={action} value={action}>
                                    {formatAction(action)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 190 }}>
                        <InputLabel id='audit-entity-type-label'>Resource</InputLabel>

                        <Select
                            label='Resource'
                            labelId="audit-entity-type-label"
                            onChange={e => {
                                setSelectedEntityType(e.target.value as AuditEntityType | '');
                                resetToFirstPage();
                            }}
                            value={selectedEntityType}
                        >
                            <MenuItem value=''>
                                <em>All resources</em>
                            </MenuItem>

                            {entityTypes.map(entityType => (
                                <MenuItem key={entityType} value={entityType}>
                                    {formatEntityType(entityType)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        label='From'
                        onChange={e => {
                            setFromDate(e.target.value);
                            resetToFirstPage();
                        }}
                        value={fromDate}
                        type="date"
                        size="small"
                        slotProps={{
                            inputLabel: { shrink: true }
                        }}
                    />

                    <TextField
                        label='To'
                        onChange={e => {
                            setToDate(e.target.value);
                            resetToFirstPage();
                        }}
                        value={toDate}
                        type="date"
                        size="small"
                        slotProps={{
                            inputLabel: { shrink: true }
                        }}
                    />
                </Stack>
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
                    <CircularProgress aria-label="Loading organization activity" />
                </Box>
            ) : entries.length === 0 ? (
                <Paper
                    sx={{
                        border: '1px dashed',
                        borderColor: 'divider',
                        p: 4,
                        textAlign: 'center'
                    }}
                >
                    <Typography sx={{ fontWeight: 600 }} variant="h6">
                        No activity found
                    </Typography>

                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                        Try changing the filters, or return after team members perform an operational action.
                    </Typography>
                </Paper>
            ) : (
                <>
                    <TableContainer component={Paper} variant="outlined">
                        <Table aria-label="Organization activity">
                            <TableHead>
                                <TableRow>
                                    <TableCell>When</TableCell>
                                    <TableCell>Team member</TableCell>
                                    <TableCell>Action</TableCell>
                                    <TableCell>Details</TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {entries.map(entry => (
                                    <TableRow key={entry.id} hover>
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                            {formatDateTime(entry.createdUtc)}
                                        </TableCell>

                                        <TableCell>{entry.actorDisplayName}</TableCell>

                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                            {formatAction(entry.action)}
                                        </TableCell>

                                        <TableCell>{entry.summary}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        sx={{
                            alignItems: { xs: 'stretch', sm: 'center' },
                            justifyContent: 'space-between'
                        }}
                    >
                        <Typography color="text.secondary" variant="body2">
                            {totalCount} activit{totalCount === 1 ? 'y' : 'ies'}
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
                </>
            )}
        </Stack>
    );
}