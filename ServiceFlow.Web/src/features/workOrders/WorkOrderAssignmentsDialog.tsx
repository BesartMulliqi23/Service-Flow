import { useEffect, useState } from "react";
import { assignTechnician, getWorkOrderAssignments, removeTechnicianAssignment, type WorkOrder, type WorkOrderAssignment } from "./workOrderApi";
import { getTechnicians, type Technician } from "../technicians/techniciansApi";
import { ApiError } from "../../api/apiClient";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, Tooltip, Typography } from "@mui/material";
import { PersonRemoveRounded } from "@mui/icons-material";

type WorkOrderAssignmentsDialogProps = {
    onClose: () => void,
    open: boolean,
    workOrder: WorkOrder | null
};

export function WorkOrderAssignmentsDialog({
    onClose,
    open,
    workOrder
}: WorkOrderAssignmentsDialogProps) {
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [assignments, setAssignments] = useState<WorkOrderAssignment[]>([]);
    const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [removingTechnicianId, setRemovingTechnicianId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !workOrder) {
            return;
        }

        const workOrderId = workOrder.id;

        let isCurrentRequest = true;

        async function loadData() {
            setIsLoading(true);
            setErrorMessage(null);
            setSelectedTechnicianId('');

            try {
                const [technicianResponse, assignmentResponse] = await Promise.all([
                    getTechnicians(),
                    getWorkOrderAssignments(workOrderId)
                ]);

                if (isCurrentRequest) {
                    setTechnicians(technicianResponse);
                    setAssignments(assignmentResponse);
                }
            } catch (error) {
                if (!isCurrentRequest) {
                    return;
                }

                if (error instanceof ApiError) {
                    setErrorMessage(error.message);
                }
                else {
                    setErrorMessage('Unable to load technician assignments. Please try again.');
                }
            } finally {
                if (isCurrentRequest) {
                    setIsLoading(false);
                }
            }
        }

        void loadData();

        return () => {
            isCurrentRequest = false;
        };
    }, [open, workOrder]);

    function handleClose() {
        if (!isAssigning && !removingTechnicianId) {
            onClose();
        }
    }

    async function handleAssign() {
        if (!workOrder || !selectedTechnicianId) {
            return;
        }

        setIsAssigning(true);
        setErrorMessage(null);

        try {
            const assignment = await assignTechnician(workOrder.id, selectedTechnicianId);

            setAssignments(current => [...current, assignment]);

            setSelectedTechnicianId('');
        } catch (error) {
            if (error instanceof ApiError) {
                setErrorMessage(error.message);
            }
            else {
                setErrorMessage('Unable to assign the technician. Please try again.');
            }
        } finally {
            setIsAssigning(false);
        }
    }

    async function handleRemove(technicianId: string) {
        if (!workOrder) {
            return;
        }

        setRemovingTechnicianId(technicianId);
        setErrorMessage(null);

        try {
            await removeTechnicianAssignment(workOrder.id, technicianId);

            setAssignments(current => current.filter(a => a.technicianId !== technicianId));
        } catch (error) {
            if (error instanceof ApiError) {
                setErrorMessage(error.message);
            }
            else {
                setErrorMessage('Unable to remove the technician assignment. Please try again.');
            }
        } finally {
            setRemovingTechnicianId(null);
        }
    }

    const assignedTechnicianIds = new Set(assignments.map(a => a.technicianId));

    const availableTechnicians = technicians.filter(t => !assignedTechnicianIds.has(t.id));

    return (
        <Dialog fullWidth maxWidth='sm' onClose={handleClose} open={open}>
            <DialogTitle>Technician assignments</DialogTitle>

            <DialogContent dividers>
                <Stack spacing={3}>
                    {workOrder && (
                        <Box>
                            <Typography sx={{ fontWeight: 600 }}>
                                {workOrder.title}
                            </Typography>

                            <Typography color='text.secondary' variant='body2'>
                                {workOrder.customerName} —{' '}
                                {workOrder.serviceLocationName}
                            </Typography>
                        </Box>
                    )}

                    {errorMessage && <Alert severity='error'>{errorMessage}</Alert>}

                    {isLoading ? (
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                py: 4
                            }}
                        >
                            <CircularProgress />
                        </Box>
                    ) : (
                        <>
                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={1}
                            >
                                <FormControl fullWidth size='small'>
                                    <InputLabel id='technician-assignment-label'>Technician</InputLabel>

                                    <Select
                                        disabled={isAssigning || availableTechnicians.length === 0}
                                        label='Technician'
                                        labelId='technician-assignment-label'
                                        onChange={e => setSelectedTechnicianId(e.target.value)}
                                        value={selectedTechnicianId}
                                    >
                                        {availableTechnicians.map(technician => (
                                            <MenuItem key={technician.id} value={technician.id}>
                                                {technician.displayName} —{' '}
                                                {technician.email}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Button
                                    disabled={!selectedTechnicianId}
                                    loading={isAssigning}
                                    onClick={() => void handleAssign()}
                                    variant='contained'
                                >
                                    Assign
                                </Button>
                            </Stack>

                            {availableTechnicians.length === 0 && (
                                <Typography color="text.secodary" variant='body2'>
                                    All available Technicians are already assigned.
                                </Typography>
                            )}

                            <Box>
                                <Typography
                                    component='h3'
                                    variant="subtitle1"
                                    sx={{ fontWeight: 600, mb: 1 }}
                                >
                                    Assigned technicians
                                </Typography>

                                {assignments.length === 0 ? (
                                    <Typography color="text.secondary" variant='body2'>
                                        No technicians have been assigned yet.
                                    </Typography>
                                ) : (
                                    <Stack spacing={1}>
                                        {assignments.map(assignment => (
                                            <Stack
                                                key={assignment.technicianId}
                                                spacing={2}
                                                direction='row'
                                                sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                                            >
                                                <Box>
                                                    <Typography>{assignment.displayName}</Typography>

                                                    <Typography color="text.secondary" variant='body2'>
                                                        {assignment.email}
                                                    </Typography>
                                                </Box>

                                                <Tooltip title='Remove assignment'>
                                                    <span>
                                                        <IconButton
                                                            aria-label={`Remove ${assignment.displayName}`}
                                                            color='warning'
                                                            disabled={
                                                                removingTechnicianId !== null
                                                                || isAssigning
                                                            }
                                                            loading={
                                                                removingTechnicianId === assignment.technicianId
                                                            }
                                                            onClick={() => void handleRemove(assignment.technicianId)}
                                                        >
                                                            <PersonRemoveRounded />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            </Stack>
                                        ))}
                                    </Stack>
                                )}
                            </Box>
                        </>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button
                    disabled={isAssigning || removingTechnicianId !== null}
                    onClick={handleClose}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}