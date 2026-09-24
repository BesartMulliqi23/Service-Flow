import { useNavigate } from "react-router";
import { useAuth } from "../features/auth/AuthContext";
import { useEffect, useState } from "react";
import { Alert, Box, CircularProgress, Container, Paper, Stack, Typography } from "@mui/material";

export function ExternalLoginSuccessPage() {
    const { refreshSession } = useAuth();
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        async function completeSignIn() {
            try {
                const currentUser = await refreshSession();

                if (currentUser === null) {
                    setErrorMessage('Your sign-in could not be completed. Please try again.');
                    return;
                }
                
                navigate('/app', { replace: true })
            } catch {
                setErrorMessage('Your sign-in succeeded, but the session could not be restored.');
            }
        }

        void completeSignIn();
    }, [navigate, refreshSession]);

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
            <Container maxWidth='sm'>
                <Paper sx={{ p: { xs: 3, sm: 5 }, border: '1px solid', borderColor: 'divider' }}>
                    <Stack spacing={3}>
                        {errorMessage ? (
                            <Alert severity="error">{errorMessage}</Alert>
                        ) : (
                            <>
                                <CircularProgress />
                                <Typography>Signing you in...</Typography>
                            </>
                        )}
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}