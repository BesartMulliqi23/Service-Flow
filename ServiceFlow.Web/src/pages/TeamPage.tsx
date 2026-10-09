import { useState, type SubmitEvent } from "react";
import { createInvitation, type InvitationRole } from "../features/invitations/invitationApi";
import { ApiError } from "../api/apiClient";
import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { PersonAddRounded } from "@mui/icons-material";

const invitationRoles: Array<{
    value: string,
    label: string,
    description: string
}> = [
        {
            value: 'Manager',
            label: 'Manager',
            description: 'Can oversee operations and manage customers and work orders.'
        },
        {
            value: 'Dispatcher',
            label: 'Dispatcher',
            description: 'Can coordinate customers, work orders, and schedules.'
        },
        {
            value: 'Technician',
            label: 'Technician',
            description: 'Can view and complete their assigned work.'
        }
    ];

export function TeamPage() {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<InvitationRole>('Technician');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        setErrorMessage(null);
        setSuccessMessage(null);
        setIsSubmitting(true);

        try {
            await createInvitation({
                email: email.trim(),
                role
            });

            setSuccessMessage(`Invitation sent to ${email.trim()}. The invitation expires in seven days.`);
            setEmail('');
            setRole('Technician');
        } catch (error) {
            setErrorMessage(
                error instanceof ApiError
                    ? error.message
                    : 'Unable to send the invitation. Please try again.'
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    const selectedRole = invitationRoles.find(r => r.value === role);

    return (
        <Stack spacing={4}>
            <Stack spacing={1}>
                <Typography component='h1' variant='h4'>
                    Team
                </Typography>

                <Typography color='text.secondary'>
                    Invite people to join your organization and give them the role
                    they need to do their work.
                </Typography>
            </Stack>

            <Paper
                component='form'
                onSubmit={handleSubmit}
                sx={{
                    maxWidth: 640,
                    p: { xs: 3, sm:  4 },
                    border: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Stack spacing={3}>
                    <Stack spacing={0.5}>
                        <Typography component='h2' variant="h6">
                            Invite a team member
                        </Typography>

                        <Typography color='text.secondary' variant="body2">
                            We will send them a secure link to create their account
                            and join this organization.
                        </Typography>
                    </Stack>

                    {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

                    {successMessage && <Alert severity="success">{successMessage}</Alert>}

                    <TextField
                        autoComplete="email"
                        disabled={isSubmitting}
                        fullWidth
                        label="Email address"
                        onChange={e => setEmail(e.target.value)}
                        value={email}
                        type='email'
                        required
                    />

                    <TextField
                        disabled={isSubmitting}
                        fullWidth
                        label="Role"
                        onChange={e => setRole(e.target.value as InvitationRole)}
                        value={role}
                        select
                    >
                        {invitationRoles.map(role => (
                            <MenuItem key={role.value} value={role.value}>
                                {role.label}
                            </MenuItem>
                        ))}
                    </TextField>

                    <Box>
                        <Typography color='text.secondary' variant="body2">
                            {selectedRole?.description}
                        </Typography>
                    </Box>

                    <Button
                        fullWidth
                        loading={isSubmitting}
                        loadingPosition="start"
                        startIcon={<PersonAddRounded />}
                        type='submit'
                        variant="contained"
                    >
                        Send invitation
                    </Button>
                </Stack>
            </Paper>
        </Stack>
    );
}