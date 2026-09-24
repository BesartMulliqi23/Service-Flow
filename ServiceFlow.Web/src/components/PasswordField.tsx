import { VisibilityOffRounded, VisibilityRounded } from "@mui/icons-material";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { useState, type ChangeEvent, type ReactNode } from "react";

type PasswordFieldProps = {
    label: string,
    value: string,
    onChange: (event: ChangeEvent<HTMLInputElement>) => void,
    autoComplete: string,
    name?: string,
    autoFocus?: boolean,
    error?: boolean,
    helperText?: ReactNode
}

export function PasswordField({
    label,
    value,
    onChange,
    autoComplete,
    name,
    autoFocus,
    error,
    helperText
}: PasswordFieldProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <TextField
            autoComplete={autoComplete}
            autoFocus={autoFocus}
            error={error}
            fullWidth
            helperText={helperText}
            label={label}
            name={name}
            onChange={onChange}
            required
            type={isVisible ? 'text' : 'password'}
            value={value}
            slotProps={{
                input: {
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                aria-label={isVisible ? 'Hide password' : 'Show password'}
                                edge='end'
                                onClick={() => setIsVisible(isVisible => !isVisible)}
                            >
                                {isVisible ? <VisibilityOffRounded /> : <VisibilityRounded />}
                            </IconButton>
                        </InputAdornment>
                    )
                }
            }}
        />
    );
}