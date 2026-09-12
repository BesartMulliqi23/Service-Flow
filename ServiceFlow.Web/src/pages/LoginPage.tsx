import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router";

export function LoginPage() {
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
                    sx={{
                        p: { xs: 3, sm: 5 },
                        border: '1px solid',
                        borderColor: 'divider'
                    }}
                >
                    <Stack spacing={3}>
                        <Typography variant="h4" component="h1">
                            Sign in to ServiceFlow
                        </Typography>

                        <Typography color="text.secondary">
                            The authentication UI will be connected in the next commit.
                        </Typography>

                        <Button
                            component={RouterLink}
                            to="/"
                            variant="text"
                            startIcon={<ArrowBackRoundedIcon />}
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            Back to welcome
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}