import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useAuth } from "../features/auth/AuthContext";
import { useState } from "react";
import { AppBar, Avatar, Box, Button, Container, Stack, Toolbar, Typography } from "@mui/material";
import { LogoutRounded } from "@mui/icons-material";

export function AppLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const location = useLocation();

    const canViewSchedule = user?.roles.some(role => ['Owner', 'Manager', 'Dispatcher'].includes(role)) ?? false;

    async function handleLogout() {
        setIsLoggingOut(true);

        try {
            await logout();
        } finally {
            navigate('/login', { replace: true });
        }
    }

    const initials = user?.displayName
        .split(' ')
        .map(part => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <Box sx={{ minHeight: '100vh' }}>
            <AppBar elevation={0} position="sticky">
                <Toolbar>
                    <Container
                        maxWidth='lg'
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2
                        }}
                    >
                        <Typography
                            component='span'
                            sx={{
                                flexGrow: 1,
                                fontSize: '1.25rem',
                                fontWeight: 700
                            }}
                        >
                            ServiceFlow
                        </Typography>

                        <Stack direction="row" spacing={1}>
                            <Button
                                color="inherit"
                                component={Link}
                                to='/app'
                                variant={location.pathname === '/app' ? 'outlined' : 'text'}
                            >
                                Dashboard
                            </Button>

                            {canViewSchedule && (
                                <Button
                                    color="inherit"
                                    component={Link}
                                    to='/app/schedule'
                                    variant={location.pathname === '/app/schedule' ? 'outlined' : 'text'}
                                >
                                    Schedule
                                </Button>
                            )}
                        </Stack>

                        <Avatar sx={{ bgcolor: 'primary.dark', width: 34, height: 34 }}>
                            {initials}
                        </Avatar>

                        <Stack
                            spacing={0}
                            sx={{
                                display: { xs: 'none', sm: 'flex' },
                                mr: 1
                            }}
                        >
                            <Typography variant="body2">{user?.displayName}</Typography>
                            <Typography sx={{ opacity: 0.75 }} variant="caption">
                                {user?.email}
                            </Typography>
                        </Stack>

                        <Button
                            color="inherit"
                            disabled={isLoggingOut}
                            onClick={() => void handleLogout()}
                            startIcon={<LogoutRounded />}
                        >
                            Sign out
                        </Button>
                    </Container>
                </Toolbar>
            </AppBar>

            <Container maxWidth='lg' sx={{ py: { xs: 3, md: 5 } }}>
                <Outlet />
            </Container>
        </Box>
    );
}