import {
  Alert,
  Box,
  Button,
  Divider,
  InputAdornment,
  Paper,
  Typography,
  Stack,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthField } from "../components/AuthField";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  return (
    <Box className="mx-auto max-w-5xl px-4 py-8">
      <div className="grid gap-6 md:grid-cols-[0.95fr_1.05fr]">
        <div className="relative min-h-[540px] overflow-hidden rounded-[28px] shadow-xl">
          <img
            alt="Entrada elegante de un motel"
            className="absolute inset-0 h-full w-full object-cover"
            src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1400&q=80"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.14),rgba(15,23,42,0.8))]" />

          <div className="relative flex h-full min-h-[540px] flex-col justify-between p-7 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <LockOutlinedIcon />
              </div>
              <div>
                <Typography fontWeight={900} variant="h5">
                  StayHub
                </Typography>
                <Typography color="white" sx={{ opacity: 0.84 }}>
                  Reservas y acceso interno
                </Typography>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="rounded-2xl bg-white/12 px-4 py-3 backdrop-blur-sm">
                <Typography fontWeight={800}>Clientes</Typography>
                <Typography color="white" sx={{ opacity: 0.82 }} variant="body2">
                  Reservas online
                </Typography>
              </div>
              <div className="rounded-2xl bg-white/12 px-4 py-3 backdrop-blur-sm">
                <Typography fontWeight={800}>Moteles</Typography>
                <Typography color="white" sx={{ opacity: 0.82 }} variant="body2">
                  Operacion interna
                </Typography>
              </div>
            </div>
          </div>
        </div>

        <Paper
          className="rounded-[28px] p-6 md:p-8"
          elevation={0}
          sx={{
            border: "1px solid #dbe3f0",
            boxShadow: "0 28px 60px rgba(15, 23, 42, 0.08)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Box
            sx={{
              background: "linear-gradient(90deg, #003b95 0%, #2563eb 100%)",
              borderRadius: "999px",
              height: 6,
              mb: 3,
              width: 120,
            }}
          />
          <Typography fontWeight={900} variant="h4">
            Iniciar sesion
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Ingresa con tu correo y contrasena.
          </Typography>

          <Stack spacing={2.5}>
            {error && <Alert severity="error">{error}</Alert>}

            <AuthField
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MailOutlineRoundedIcon sx={{ color: "#94a3b8" }} />
                  </InputAdornment>
                ),
              }}
              label="Correo electronico *"
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="tu@correo.com"
              value={form.email}
            />

            <AuthField
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <KeyRoundedIcon sx={{ color: "#94a3b8" }} />
                  </InputAdornment>
                ),
              }}
              label="Contrasena *"
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Ingresa tu contrasena"
              type="password"
              value={form.password}
            />

            <Button
              onClick={async () => {
                try {
                  const session = await login(form);
                  navigate(session.user.role === "CUSTOMER" ? "/my-bookings" : "/management");
                } catch (requestError: any) {
                  setError(requestError.response?.data?.message || "No fue posible iniciar sesion.");
                }
              }}
              size="large"
              startIcon={<LoginRoundedIcon />}
              sx={{ borderRadius: "14px", fontWeight: 800, py: 1.6 }}
              variant="contained"
            >
              Entrar ahora
            </Button>
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Typography color="text.secondary" textAlign="center">
            No tienes cuenta? <Link to="/register">Registrate aqui</Link>
          </Typography>
        </Paper>
      </div>
    </Box>
  );
}
