import { useState, type SubmitEvent } from "react";
import { Link } from "react-router";
import { completeExternalOnboarding } from "../features/auth/authApi";
import { ApiError } from "../api/apiClient";
import { Alert, Box, Button, Container, Paper, Stack, TextField, Typography } from "@mui/material";

export function ExternalOnboardingPage() {
    const [organizationName, setOrganizationName] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        setErrorMessage(null);
        setIsSubmitting(true);

        try {
            const result = await completeExternalOnboarding(organizationName);

            window.location.assign(result.redirectUri);
        } catch (error) {
            setErrorMessage(
                error instanceof ApiError
                ? error.message
                : 'Unable to create your organization workspace.'
            );

            setIsSubmitting(false);
        }
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
                                Set up your workspace
                            </Typography>

                            <Typography color="text.secondary">
                                Your external account is verified. Give your organization a name
                                to finish setting up ServiceFlow.
                            </Typography>
                        </Stack>

                        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

                        <TextField 
                            autoFocus
                            fullWidth
                            label='Organization name'
                            onChange={e => setOrganizationName(e.target.value)}
                            required
                            value={organizationName}
                        />

                        <Button
                            fullWidth
                            loading={isSubmitting}
                            loadingPosition="center"
                            size="large"
                            type="submit"
                            variant="contained"
                        >
                            Create workspace
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