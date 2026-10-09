import { Link, useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../features/auth/AuthContext";
import { useEffect, useState, type ReactNode, type SubmitEvent } from "react";
import { completeInvitation, getInvitation, type InvitationDetails } from "../features/invitations/invitationApi";
import { ApiError } from "../api/apiClient";
import { Alert, Box, Button, CircularProgress, Container, Paper, Stack, TextField, Typography } from "@mui/material";
import { CheckCircleRounded, PersonAddRounded } from "@mui/icons-material";
import { PasswordField } from "../components/PasswordField";
import { PasswordRequirements } from "../components/PasswordRequirements";

export function AcceptInvitationPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { refreshSession } = useAuth();

    const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
    const [isLoadingInvitation, setIsLoadingInvitation] = useState(true);
    const [invitationError, setInvitationError] = useState<string | null>(null);

    const [displayName, setDisplayName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAcceptanceComplete, setIsAcceptanceComplete] = useState(false);

    const token = searchParams.get('token');

    useEffect(() => {
        async function loadInvitation() {
            if (!token) {
                setInvitationError('This invitation link is invalid.');
                setIsLoadingInvitation(false);
                return;
            }

            try {
                const invitationDetails = await getInvitation(token);

                setInvitation(invitationDetails);
            } catch (error) {
                if (error instanceof ApiError) {
                    if (error.status === 404) {
                        setInvitationError('This invitation link is invalid.');
                    }
                    else {
                        setInvitationError(error.message);
                    }
                }
                else {
                    setInvitationError('We could not load this invitation. Please try again.');
                }
            } finally {
                setIsLoadingInvitation(false);
            }
        }

        void loadInvitation();
    }, [token]);

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!token) {
            setFormError('This invitation link is invalid.');
            return;
        }

        setFormError(null);

        if (password !== confirmPassword) {
            setFormError('Passwords do not match.');
            return;
        }

        setIsSubmitting(true);

        try {
            await completeInvitation({
                token,
                displayName,
                password,
                confirmPassword
            });

            const currentUser = await refreshSession();

            if (currentUser === null) {
                setFormError('Your account was created, but we could not sign you in. Please sign in manually.');
                return;
            }

            setIsAcceptanceComplete(true);
        } catch (error) {
            setFormError(
                error instanceof ApiError
                    ? error.message
                    : 'Unable to accept the invitation. Please try again.'
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoadingInvitation) {
        return (
            <CenteredCard>
                <Stack spacing={2} sx={{ alignItems: 'center' }}>
                    <CircularProgress />
                    <Typography color='text.secondary'>
                        Checking your invitation…
                    </Typography>
                </Stack>
            </CenteredCard>
        );
    }

    if (invitationError || invitation === null) {
        return (
            <CenteredCard>
                <Stack spacing={3}>
                    <Typography component='h1' variant='h4'>
                        Invitation unavailable
                    </Typography>

                    <Alert severity='error'>
                        {invitationError ?? 'This invitation could not be loaded.'}
                    </Alert>

                    <Button component={Link} to='/login' variant='contained'>
                        Go to signin
                    </Button>
                </Stack>
            </CenteredCard>
        );
    }

    if (isAcceptanceComplete) {
        return (
            <CenteredCard>
                <Stack spacing={3} sx={{ alignItems: 'flex-start' }}>
                    <CheckCircleRounded color='success' sx={{ fontSize: 44}} />

                    <Typography component='h1' variant='h4'>
                        You are part of the team
                    </Typography>

                    <Typography color='text.secondary'>
                        Your account has been created and you have joined{" "}
                        {invitation.organizationName}.
                    </Typography>

                    <Button
                        onClick={() => navigate('/app', { replace: true })}
                        variant='contained'
                    >
                        Continue to ServiceFlow
                    </Button>
                </Stack>
            </CenteredCard>
        );
    }

    return (
        <CenteredCard>
            <Stack component='form' onSubmit={handleSubmit} spacing={3}>
                <Stack spacing={1}>
                    <Typography component='h1' variant='h4'>
                        Join {invitation.organizationName}
                    </Typography>

                    <Typography color='text.secondary'>
                        You have been invited as a {invitation.role}.
                    </Typography>
                </Stack>

                <Alert severity="info">
                    This invitation was sent to <strong>{invitation.email}</strong>.
                </Alert>

                {formError && <Alert severity="error">{formError}</Alert>}

                <TextField
                    autoComplete="name"
                    autoFocus
                    disabled={isSubmitting}
                    fullWidth
                    label='Your name'
                    onChange={e => setDisplayName(e.target.value)}
                    value={displayName}
                    required
                />

                <PasswordField
                    autoComplete="new-password"
                    label="Password"
                    onChange={e => setPassword(e.target.value)}
                    value={password}
                />

                <PasswordRequirements />

                <PasswordField
                    autoComplete="confirm-password"
                    label="Confirm password"
                    onChange={e => setConfirmPassword(e.target.value)}
                    value={confirmPassword}
                />

                <Button
                    fullWidth
                    loading={isSubmitting}
                    loadingPosition="start"
                    startIcon={<PersonAddRounded />}
                    type='submit'
                    variant='contained'
                >
                    Create account and join team
                </Button>

                <Typography align="center" color='text.secondary' variant='body2'>
                    Already have an account?{' '}
                    <Button component={Link} to="/login" size='small'>
                        Sign in
                    </Button>
                </Typography>
            </Stack>
        </CenteredCard>
    );
}

function CenteredCard({ children }: { children: ReactNode }) {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                py: 4
            }}
        >
            <Container maxWidth='sm'>
                <Paper
                    sx={{
                        p: { xs: 3, sm: 5 },
                        border: '1px solid',
                        borderColor: 'divider'
                    }}
                >
                    {children}
                </Paper>
            </Container>
        </Box>
    );
}