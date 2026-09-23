import { useState, type SubmitEvent } from "react";
import { requestPasswordReset } from "../features/auth/authApi";
import { ApiError } from "../api/apiClient";
import { Alert, Box, Button, Container, Paper, Stack, TextField, Typography } from "@mui/material";
import { Link } from "react-router";

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isRequestSent, setIsRequestSent] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        
        setIsSubmitting(true);
        setIsRequestSent(false);
        setErrorMessage(null);

        try {
            await requestPasswordReset(email);
            setIsRequestSent(true);
            setEmail('');
        } catch (error) {
            setErrorMessage(
                error instanceof ApiError
                ? error.message
                : 'Unable to request a reset link.'
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isRequestSent) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
                <Container maxWidth='sm'>
                    <Paper sx={{ p: { xs: 3, sm: 5 }, border: '1px solid', borderColor: 'divider' }}>
                        <Stack spacing={3}>
                            <Alert severity="success">
                                If an account exists for that email, a reset link has been sent.
                            </Alert>

                            <Typography color="text.secondary">
                                Check your inbox and follow the instructions in the email.
                            </Typography>

                            <Button component={Link} to='/login' variant="contained">
                                Return to sign in
                            </Button>

                            <Button onClick={() => setIsRequestSent(false)}>
                                Use a different email address
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
                        <Typography variant="h4">Reset your password</Typography>
                        <Typography color="text.secondary">
                            Enter your email address and we will send reset instructions.
                        </Typography>

                        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

                        <TextField 
                            label='Email address'
                            value={email}
                            type="email"
                            onChange={e => setEmail(e.target.value)}
                            required
                            fullWidth
                            autoFocus
                        />

                        <Button 
                            type="submit" 
                            variant="contained" 
                            loading={isSubmitting}
                            loadingPosition="center"
                            fullWidth
                        >
                            Send reset link
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