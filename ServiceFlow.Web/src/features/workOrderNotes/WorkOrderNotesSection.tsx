import { useEffect, useState, type SubmitEvent } from "react";
import type { WorkOrderNote } from "./workOrderNotesApi";
import { ApiError } from "../../api/apiClient";
import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from "@mui/material";
import { NoteAddRounded } from "@mui/icons-material";

type WorkOrderNotesSectionProps = {
    canAddNote: boolean,
    emptyMessage: string,
    loadNotes: () => Promise<WorkOrderNote[]>,
    onAddNote: (content: string) => Promise<WorkOrderNote>,
    readOnlyMessage: string
};

function formatNoteTimestamp(value: string) {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(new Date(value));
}

export function WorkOrderNotesSection({
    canAddNote,
    emptyMessage,
    loadNotes,
    onAddNote,
    readOnlyMessage
}: WorkOrderNotesSectionProps) {
    const [notes, setNotes] = useState<WorkOrderNote[]>([]);
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [validationMessage, setValidationMessage] = useState<string | null>(null);

    useEffect(() => {
        let isCurrentRequest = true;

        async function load() {
            setIsLoading(true);
            setErrorMessage(null);

            try {
                const response = await loadNotes();

                if (isCurrentRequest) {
                    setNotes(response);
                }
            } catch (error) {
                if (!isCurrentRequest) return;

                setErrorMessage(
                    error instanceof ApiError
                    ? error.message
                    : 'Unable to load job notes. Please try again in a moment.'
                );
            } finally {
                if (isCurrentRequest) {
                    setIsLoading(false);
                }
            }
        }

        void load();

        return () => {
            isCurrentRequest = false;
        };
    }, [loadNotes]);

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedContent = content.trim();

        if (!trimmedContent) {
            setValidationMessage('A job note is required.');
            return;
        }

        if (trimmedContent.length > 4000) {
            setValidationMessage('A job note cannot exceed 4000 characters.');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage(null);
        setValidationMessage(null);

        try {
            const savedNote = await onAddNote(trimmedContent);

            setNotes(currentNotes => [
                savedNote,
                ...currentNotes.filter(note => note.id !== savedNote.id)
            ]);

            setContent('');
        } catch (error) {
            setErrorMessage(
                error instanceof ApiError
                    ? error.message
                    : 'Unable to save the job note. Please try again.'
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Paper sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={3}>
                <Stack spacing={0.5}>
                    <Typography component='h2' variant="h6" sx={{ fontWeight: 700 }}>
                        Job notes
                    </Typography>

                    <Typography color="text.secondary" variant="body2">
                        Record on-site findings, progress updates, and relevant work details.
                    </Typography>
                </Stack>

                {canAddNote ? (
                    <Box component='form' onSubmit={e => void handleSubmit(e)}>
                        <Stack spacing={1.5}>
                            <TextField
                                disabled={isSubmitting}
                                error={Boolean(validationMessage)}
                                fullWidth
                                helperText={validationMessage ?? `${content.length}/4000 characters`}
                                label='Add a job note'
                                minRows={3}
                                multiline
                                onChange={e => {
                                    setContent(e.target.value);
                                    setValidationMessage(null)
                                }}
                                value={content}
                                placeholder="Describe what you found, what was completed, or what still needs attention."
                                required
                                slotProps={{ htmlInput: { maxLength: 4000 } }}
                            />

                            <Box>
                                <Button
                                    loading={isSubmitting}
                                    loadingPosition="start"
                                    startIcon={<NoteAddRounded />}
                                    type="submit"
                                    variant="contained"
                                >
                                    Add note
                                </Button>
                            </Box>
                        </Stack>
                    </Box>
                ) : (
                    <Alert severity="info">{readOnlyMessage}</Alert>
                )}

                {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

                {isLoading ? (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            py: 3
                        }}
                    >
                        <CircularProgress aria-label="Loading job notes" />
                    </Box>
                ) : (
                    <WorkOrderNotesTimeline
                        emptyMessage={emptyMessage}
                        notes={notes}
                    />
                )}
            </Stack>
        </Paper>
    );
}

type WorkOrderNotesTimelineProps = {
    emptyMessage: string,
    notes: WorkOrderNote[]
};

export function WorkOrderNotesTimeline({
    emptyMessage,
    notes
}: WorkOrderNotesTimelineProps) {
    if (notes.length === 0) {
        return (
            <Typography color="text.secondary">
                {emptyMessage}
            </Typography>
        );
    }

    return (
        <Stack spacing={1.5}>
            {notes.map(note => (
                <Box 
                    key={note.id}
                    sx={{
                        borderLeft: 3,
                        borderColor: 'primary.main',
                        pl: 2
                    }}
                >
                    <Stack spacing={0.5}>
                        <Typography sx={{ fontWeight: 600 }} variant="body2">
                            {note.createdByDisplayName}
                        </Typography>

                        <Typography color="text.secondary" variant="caption">
                            {formatNoteTimestamp(note.createdUtc)}
                        </Typography>

                        <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                            {note.content}
                        </Typography>
                    </Stack>
                </Box>
            ))}
        </Stack>
    );
}