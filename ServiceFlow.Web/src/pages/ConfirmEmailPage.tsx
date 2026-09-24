import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { confirmEmail } from "../features/auth/authApi";
import { ApiError } from "../api/apiClient";
import { Alert, Box, Button, CircularProgress, Container, Paper, Stack, Typography } from "@mui/material";

export function ConfirmEmailPage() {
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const userId = searchParams.get('userId');
        const token = searchParams.get('token');

        if (!userId || !token) {
            setErrorMessage('This email confirmation link is invalid.');
            setIsLoading(false);
            return;
        }

        async function confirm() {
            try {
                const result = await confirmEmail(userId!, token!);
                setMessage(result.message);
            } catch (error) {
                setErrorMessage(
                    error instanceof ApiError
                    ? error.message
                    : 'Unable to confirm your email address.'
                );
            } finally {
                setIsLoading(false);
            }
        }

        void confirm();
    }, [searchParams]);

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
            <Container maxWidth='sm'>
                <Paper sx={{ p: { xs: 3, sm: 5 }, border: '1px solid', borderColor: 'divider' }}>
                    <Stack spacing={3}>
                        <Typography variant="h3" component='h1'>
                            Confirm your email
                        </Typography>

                        {isLoading && <CircularProgress />}

                        {message && <Alert severity="success">{message}</Alert>}

                        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

                        {!isLoading && (
                            <Button component={Link} to='/login' variant="contained">
                                Continue to sign in
                            </Button>
                        )}
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}