import { Box, TextField, Typography } from "@mui/material";
import type { TextFieldProps } from "@mui/material";

interface AuthFieldProps extends Omit<TextFieldProps, "label" | "variant"> {
  label: string;
}

export function AuthField({ label, ...props }: AuthFieldProps) {
  return (
    <Box sx={{ position: "relative", pt: 1.3 }}>
      <Typography
        component="span"
        sx={{
          backgroundColor: "#ffffff",
          color: "#0f172a",
          fontSize: 13,
          fontWeight: 800,
          left: 14,
          letterSpacing: "0.01em",
          lineHeight: 1,
          px: 1,
          position: "absolute",
          top: 0,
          zIndex: 1,
        }}
      >
        {label}
      </Typography>
      <TextField
        fullWidth
        placeholder={typeof props.placeholder === "string" ? props.placeholder : undefined}
        sx={{
          "& .MuiInputBase-input::placeholder": {
            color: "#94a3b8",
            opacity: 1,
          },
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
            transition: "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
            "& fieldset": {
              borderColor: "#cbd5e1",
              borderWidth: 1.2,
            },
            "&:hover": {
              transform: "translateY(-1px)",
            },
            "&:hover fieldset": {
              borderColor: "#94a3b8",
            },
            "&.Mui-focused": {
              boxShadow: "0 16px 32px rgba(0, 59, 149, 0.14)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#003b95",
              borderWidth: 1.6,
            },
          },
          "& .MuiOutlinedInput-input": {
            paddingBlock: "14px",
          },
        }}
        variant="outlined"
        {...props}
      />
    </Box>
  );
}
