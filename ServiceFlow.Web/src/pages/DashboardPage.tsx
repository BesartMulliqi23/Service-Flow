import { Chip, Paper, Stack, Typography } from "@mui/material";
import { useAuth } from "../features/auth/AuthContext";
import { AssignmentTurnedIn } from "@mui/icons-material";

export function DashboardPage() {
    const { user } = useAuth();

    return (
        <Stack spacing={4}>
            <Stack spacing={1}>
                <Typography variant="h4" component='h1'>
                    Welcome back, {user?.displayName}
                </Typography>

                <Typography color="text.secondary">
                    Your ServiceFlow workspace is connected and ready for the operational
                    screens we will add next.
                </Typography>
            </Stack>

            <Paper
                sx={{
                    p: { xs: 3, md: 4 },
                    border: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Stack spacing={2}>
                    <AssignmentTurnedIn color="primary" />

                    <Typography variant="h6">
                        Workspace foundation complete
                    </Typography>

                    <Typography color="text.secondary">
                        Customer, dispatch, calendar, and Technician views will build on
                        this authenticated application shell.
                    </Typography>

                    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                        {user?.roles.map(role => (
                            <Chip key={role} label={role} size="small" />
                        ))}
                    </Stack>
                </Stack>
            </Paper>
        </Stack>
    );
}