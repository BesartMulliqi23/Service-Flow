import { Alert, Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { Link } from "react-router";

export function ExternalLoginErrorPage() {
    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
            <Container maxWidth='sm'>
                <Paper sx={{ p: { xs: 3, sm: 5 }, border: '1px solid', borderColor: 'divider' }}>
                    <Stack spacing={3}>
                        <Typography variant="h4" component="h1">
                            External sign-in failed
                        </Typography>
                        
                        <Alert severity="error">
                            We could not complete sign-in with the selected provider. Please
                            try again or use email and password.
                        </Alert>

                        <Button component={Link} to='/login' variant="contained">
                            Return to sign in
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}