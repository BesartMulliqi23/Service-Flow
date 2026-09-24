import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
    palette: {
        primary: {
            main: '#155EEF',
            dark: '#004EEB',
            light: '#528BFF'
        },
        secondary: {
            main: '#344054'
        },
        background: {
            default: '#F8FAFC',
            paper: '#FFFFFF'
        }
    },
    shape: {
        borderRadius: 12
    },
    typography: {
        fontFamily: '"Inter", "Segoe UI", sans-serif',
        h4: {
            fontWeight: 700
        },
        h5: {
            fontWeight: 700
        },
        button: {
            fontWeight: 600,
            textTransform: "none"
        }
    },
    components: {
        MuiButton: {
            defaultProps: {
                disableElevation: true
            }
        },
        MuiPaper: {
            defaultProps: {
                elevation: 0
            }
        }
    }
});