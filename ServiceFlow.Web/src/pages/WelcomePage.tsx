import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded'
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from 'react-router'

export function WelcomePage() {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                py: 4
            }}
        >
            <Container maxWidth="md">
                <Paper
                    sx={{
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider'
                    }}
                >
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        sx={{ minHeight: 460 }}
                    >
                        <Box
                            sx={{
                                flex: 1,
                                p: { xs: 4, md: 6 },
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText'
                            }}
                        >
                            <Stack spacing={3}>
                                <AssignmentTurnedInRoundedIcon sx={{ fontSize: 42 }} />
                                <Typography variant="h3" component="h1">
                                    ServiceFlow
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.9 }}>
                                    Field-service operations, coordinated from dispatch to completion.
                                </Typography>
                            </Stack>
                        </Box>

                        <Box
                            sx={{
                                flex: 1,
                                p: { xs: 4, md: 6 },
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <Stack spacing={3}>
                                <Typography variant="overline" color="primary.main">
                                    Application foundation
                                </Typography>

                                <Typography variant="h4">
                                    The ServiceFlow web application is ready to connect.
                                </Typography>

                                <Typography color="text.secondary">
                                    Routing, a shared API client, secure cookie support, and the
                                    product theme are now in place.
                                </Typography>

                                <Button
                                    component={RouterLink}
                                    to="/login"
                                    variant="contained"
                                    endIcon={<ArrowForwardRoundedIcon />}
                                >
                                    Continue to sign in
                                </Button>
                            </Stack>
                        </Box>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}