import { Alert, Box, Typography } from "@mui/material";

export function PasswordRequirements() {
    return (
        <Alert icon={false} severity="info">
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Password requirements
            </Typography>

            <Box component='ul' sx={{ mb: 0, mt: 0.5, pl: 2.5 }}>
                <li>At least 12 characters</li>
                <li>At least one uppercase letter</li>
                <li>At least one lowercase letter</li>
                <li>At least one digit</li>
                <li>At least one special character</li>
            </Box>
        </Alert>
    );
}