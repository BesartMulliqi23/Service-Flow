import { useState, type SubmitEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { resetPassword } from "../features/auth/authApi";
import { ApiError } from "../api/apiClient";
import { Alert, Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { CheckCircleRounded, SaveRounded } from "@mui/icons-material";
import { PasswordField } from "../components/PasswordField";
import { PasswordRequirements } from "../components/PasswordRequirements";

export function ResetPasswordPage() {
    const [searchParams] = useSearchParams();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResetComplete, setIsResetComplete] = useState(false);

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const userId = searchParams.get('userId');
        const token = searchParams.get('token');

        setErrorMessage(null);

        if (!userId || !token) {
            setErrorMessage('The password reset link is invalid.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }

        setIsSubmitting(true);

        try {
            await resetPassword(userId, token, newPassword, confirmPassword);
            setIsResetComplete(true);
        } catch (error) {
            setErrorMessage(
                error instanceof ApiError
                ? error.message
                : 'Unable to reset password.'
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isResetComplete) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
                <Container maxWidth='sm'>
                    <Paper sx={{ p: { xs: 3, sm: 5 }, border: '1px solid', borderColor: 'divider' }}>
                        <Stack spacing={3} sx={{ alignItems: 'flex-start' }}>
                            <CheckCircleRounded color="success" sx={{ fontSize: 44 }} />

                            <Typography variant="h4" component='h1'>
                                Password updated.
                            </Typography>

                            <Typography color="text.secondary">
                                Your password has been reset successfully. You can now sign in
                                with your new password.
                            </Typography>

                            <Button component={Link} to='/login' variant="contained">
                                Continue to sign in
                            </Button>
                        </Stack>
                    </Paper>
                </Container>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
            <Container maxWidth='sm'>
                <Paper
                    component='form'
                    onSubmit={handleSubmit}
                    sx={{ p: { xs: 3, sm: 5 }, border: '1px solid', borderColor: 'divider' }}
                >
                    <Stack spacing={3}>
                        <Stack spacing={1}>
                            <Typography variant="h4" component='h1'>
                                Choose a new password
                            </Typography>

                            <Typography color="text.secondary">
                                Use a strong password that you do not use elsewhere.
                            </Typography>
                        </Stack>

                        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

                        <PasswordField 
                            label='New password'
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            autoComplete="new-password"
                            autoFocus
                        />

                        <PasswordRequirements />

                        <PasswordField 
                            label='Confirm new password'
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            autoComplete="new-password"
                        />

                        <Button 
                            type="submit" 
                            variant="contained" 
                            loading={isSubmitting}
                            loadingPosition="start"
                            startIcon={<SaveRounded />}
                            size="large"
                            fullWidth
                        >
                            Reset password
                        </Button>

                        <Button component={Link} to='/login'>
                            Return to sign in
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}