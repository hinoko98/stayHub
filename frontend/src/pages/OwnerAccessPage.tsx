import {
  Alert,
  Box,
  Button,
  Divider,
  InputAdornment,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import { AuthField } from "../components/AuthField";
import { useAuth } from "../context/AuthContext";

const INTERNAL_ROLES = new Set([
  "HOTEL_ADMIN",
  "HOTEL_STAFF",
  "SUPER_ADMIN",
  "RECEPTION",
  "CASHIER",
  "HOUSEKEEPING",
]);

export function OwnerAccessPage() {
  const navigate = useNavigate();
  const { login, logout, session } = useAuth();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  if (session?.user.role === "CUSTOMER") {
    return <Navigate replace to="/my-bookings" />;
  }

  if (session && INTERNAL_ROLES.has(session.user.role)) {
    return <Navigate replace to="/management" />;
  }

  return (
    <Box className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4">
        <Button component={Link} startIcon={<ArrowBackRoundedIcon />} sx={{ fontWeight: 700 }} to="/">
          Volver al inicio
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="overflow-hidden rounded-[32px] bg-[linear-gradient(160deg,#0f172a_0%,#003b95_48%,#1d4ed8_100%)] p-7 text-white shadow-2xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <ApartmentRoundedIcon />
            </div>
            <div>
              <Typography fontWeight={900} variant="h5">
                Sistema motelero
              </Typography>
              <Typography sx={{ opacity: 0.8 }}>
                Acceso de duenos, administradores y personal interno
              </Typography>
            </div>
          </div>

          <Typography fontWeight={900} sx={{ fontSize: { md: 38, xs: 30 }, lineHeight: 1.04 }}>
            Controla la operacion de cada hotel desde su propio acceso.
          </Typography>
          <Typography className="mt-4 max-w-xl text-white/80">
            Este portal concentra el ingreso interno para cada hotel. Cada cuenta queda limitada a su propiedad o al
            alcance del administrador general.
          </Typography>

          <Stack mt={5} spacing={2}>
            {[
              "Consulta reservas activas y cambios de estado.",
              "Administra habitaciones y disponibilidad del hotel asignado.",
              "Mantiene separada la operacion de cada sede.",
            ].map((item) => (
              <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3" key={item}>
                <ShieldRoundedIcon sx={{ color: "#febb02", fontSize: 18 }} />
                <Typography>{item}</Typography>
              </div>
            ))}
          </Stack>

          <div className="mt-7 grid gap-3">
            <div className="rounded-[24px] border border-white/10 bg-slate-950/20 p-4">
              <Typography fontWeight={800}>Hotel demo</Typography>
              <Typography sx={{ opacity: 0.88 }} variant="body2">
                admin.k18@motelcompleto.local
              </Typography>
              <Typography sx={{ opacity: 0.72 }} variant="body2">
                Motel123*
              </Typography>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-slate-950/20 p-4">
              <Typography fontWeight={800}>Administrador general</Typography>
              <Typography sx={{ opacity: 0.88 }} variant="body2">
                admin@motelcompleto.local
              </Typography>
              <Typography sx={{ opacity: 0.72 }} variant="body2">
                Admin123*
              </Typography>
            </div>
          </div>
        </div>

        <Paper
          className="rounded-[32px] p-6 md:p-8"
          elevation={0}
          sx={{
            border: "1px solid #dbe3f0",
            boxShadow: "0 28px 60px rgba(15, 23, 42, 0.08)",
          }}
        >
          <Box
            sx={{
              background: "linear-gradient(90deg, #0f172a 0%, #2563eb 100%)",
              borderRadius: "999px",
              height: 6,
              mb: 3,
              width: 132,
            }}
          />

          <Typography fontWeight={900} variant="h4">
            Acceso a hoteles
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Ingresa con tu correo interno y contrasena para entrar al sistema del hotel.
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
              label="Correo interno *"
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="hotel@correo.com"
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
                  const nextSession = await login(form);

                  if (nextSession.user.role === "CUSTOMER") {
                    logout();
                    setError("Este acceso es exclusivo para duenos y personal del hotel.");
                    return;
                  }

                  navigate("/management");
                } catch (requestError: any) {
                  setError(requestError.response?.data?.message || "No fue posible iniciar sesion.");
                }
              }}
              size="large"
              startIcon={<LoginRoundedIcon />}
              sx={{ borderRadius: "14px", fontWeight: 800, py: 1.6 }}
              variant="contained"
            >
              Entrar al portal
            </Button>
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Stack spacing={1.2}>
            <Typography fontWeight={800}>Necesitas ayuda?</Typography>
            <Typography color="text.secondary" variant="body2">
              Si tu cuenta no entra al portal, verifica que sea una cuenta interna del hotel y no una cuenta cliente.
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Para accesos nuevos o restablecimiento de clave, usa el administrador general del sistema.
            </Typography>
          </Stack>
        </Paper>
      </div>
    </Box>
  );
}
