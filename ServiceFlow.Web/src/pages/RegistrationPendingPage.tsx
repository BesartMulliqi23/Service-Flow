import { MarkEmailReadRounded } from '@mui/icons-material'
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { Link } from 'react-router';

export function RegistrationPendingPage() {
    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
            <Container maxWidth='sm'>
                <Paper sx={{ p: { xs: 3, sm: 5 }, border: '1px solid', borderColor: 'divider' }}>
                    <Stack 
                        spacing={3} 
                        sx={{ alignItems: 'flex-start' }}
                    >
                        <MarkEmailReadRounded color='primary' sx={{ fontSize: 42 }} />

                        <Typography variant='h4' component='h1'>
                            Check your email
                        </Typography>

                        <Typography color='text.secondary'>
                            Your workspace was created. Confirm your email address to activate
                            your account, then return here to sign in.
                        </Typography>

                        <Button component={Link} to='/login' variant='contained'>
                            Return to sign in
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}