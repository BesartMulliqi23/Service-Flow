import { Alert, Box, Button, Checkbox, CircularProgress, Container, FormControlLabel, Paper, Stack, TextField, Typography } from "@mui/material";
import { Navigate, useLocation, useNavigate } from "react-router";
import { useAuth } from '../features/auth/AuthContext';
import { useState, type SubmitEvent } from 'react';
import { FullPageLoader } from '../components/FullPageLoader';
import { ApiError } from '../api/apiClient';
import { ArrowForwardRounded, LockOutlined } from "@mui/icons-material";

type NavigationState = {
    from?: string
}

export function LoginPage() {
    const { user, isInitializing, login } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (isInitializing) {
        return <FullPageLoader />;
    }

    if (user !== null) {
        return <Navigate to='/app' replace />
    }

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        setErrorMessage(null);
        setIsSubmitting(true);

        try {
            await login({
                email,
                password,
                rememberMe
            });

            const state = location.state as NavigationState | null;
            navigate(state?.from ?? '/app', { replace: true });
        } catch (error) {
            setErrorMessage(
                error instanceof ApiError
                    ? error.message
                    : 'Unable to signin. Please try again.'
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                py: 4
            }}
        >
            <Container maxWidth="sm">
                <Paper
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{
                        p: { xs: 3, sm: 5 },
                        border: '1 px solid',
                        borderColor: 'divider'
                    }}
                >
                    <Stack spacing={3}>
                        <Stack spacing={1}>
                            <LockOutlined color='primary' />
                            <Typography variant='h4' component='h1'>
                                Welcome back
                            </Typography>
                            <Typography color='text.secondary'>
                                Sign in to manage your organization's field operations.
                            </Typography>
                        </Stack>

                        {errorMessage && <Alert severity='error'>{errorMessage}</Alert>}

                        <TextField 
                            autoComplete='email'
                            autoFocus
                            fullWidth
                            label='Email address'
                            name='email'
                            onChange={e => setEmail(e.target.value)}
                            required
                            type='email'
                            value={email}
                        />

                        <TextField 
                            autoComplete='current-password'
                            fullWidth
                            label='Password'
                            name='password'
                            onChange={e => setPassword(e.target.value)}
                            required
                            type='password'
                            value={password}
                        />

                        <FormControlLabel 
                            control={
                                <Checkbox 
                                    checked={rememberMe}
                                    onChange={e => setRememberMe(e.target.checked)}   
                                />
                            }
                            label='Remember me'
                        />

                        <Button
                            disabled={isSubmitting}
                            endIcon={
                                isSubmitting ? (
                                    <CircularProgress color='inherit' size={18} />
                                ) : (
                                    <ArrowForwardRounded />
                                )
                            }
                            fullWidth
                            size='large'
                            type='submit'
                            variant='contained'
                        >
                            Sign in
                        </Button>

                        <Typography align='center' color='text.secondary' variant='body2'>
                            Registration and password recovery screens will be added next.
                        </Typography>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}