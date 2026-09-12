import { Button, Container, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from 'react-router'

export function NotFoundPage() {
    return (
        <Container maxWidth="sm" sx={{ py: 12 }}>
            <Stack 
                spacing={3}
                sx={{
                    alignItems: 'flex-start'
                }}
            >
                <Typography variant="h3" component="h1">
                    Page not found
                </Typography>

                <Typography color="text.secondary">
                    The page you requested does not exist.
                </Typography>

                <Button component={RouterLink} to="/" variant="contained">
                    Return to ServiceFlow
                </Button>
            </Stack>
        </Container>
    );
}