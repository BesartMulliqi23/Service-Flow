import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router";
import { registerUser } from "../features/auth/authApi";
import { ApiError } from "../api/apiClient";
import { Alert, Box, Button, Container, Paper, Stack, TextField, Typography } from "@mui/material";
import { PasswordField } from "../components/PasswordField";
import { PasswordRequirements } from "../components/PasswordRequirements";
import { PersonAddRounded } from "@mui/icons-material";

export function RegisterPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [organizationName, setOrganizationName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage(null);

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }

        setIsSubmitting(true);

        try {
            await registerUser({
                email,
                displayName,
                organizationName,
                password,
                confirmPassword
            })

            navigate('/registration-pending', { replace: true });
        } catch (error) {
            setErrorMessage(
                error instanceof ApiError 
                ? error.message
                : 'Unable to create your account. Please try again.'
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
            <Container maxWidth="sm">
                <Paper
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{ p: { xs: 3, sm: 5 }, border: '1px solid', borderColor: 'divider' }}
                >
                    <Stack spacing={3}>
                        <Stack spacing={1}>
                            <Typography variant="h4" component="h1">
                                Create your workspace
                            </Typography>
                            <Typography color="text.secondary">
                                Start managing your field-service operations with ServiceFlow.
                            </Typography>
                        </Stack>

                        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

                        <TextField
                            label="Organization name"
                            value={organizationName}
                            onChange={e => setOrganizationName(e.target.value)}
                            required
                            fullWidth
                            autoFocus
                        />

                        <TextField
                            label="Your name"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            required
                            fullWidth
                        />

                        <TextField
                            label="Email address"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            fullWidth
                            autoComplete="email"
                        />

                        <PasswordField
                            label="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete="new-password"
                        />

                        <PasswordRequirements />

                        <PasswordField
                            label="Confirm password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            autoComplete="new-password"
                        />

                        <Button 
                            loading={isSubmitting}
                            loadingPosition="start"
                            startIcon={<PersonAddRounded />}
                            type="submit"
                            variant="contained"
                            size="large"
                            fullWidth
                        >
                            Create workspace
                        </Button>

                        <Typography align="center" color="text.secondary" variant="body2">
                            Already have an account?{' '}
                            <Button component={Link} to='/login' size="small">
                                Sign in
                            </Button>
                        </Typography>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}