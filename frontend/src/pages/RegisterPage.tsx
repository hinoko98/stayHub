import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  InputAdornment,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import LocalPhoneOutlinedIcon from "@mui/icons-material/LocalPhoneOutlined";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthField } from "../components/AuthField";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  return (
    <Box className="mx-auto max-w-5xl px-4 py-8">
      <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[28px] bg-[linear-gradient(160deg,#e0ecff_0%,#ffffff_55%,#f8fbff_100%)] p-7 shadow-sm">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#003b95] text-white">
              <LockOutlinedIcon />
            </div>
            <Typography color="#003b95" fontWeight={900} variant="h5">
              StayHub
            </Typography>
          </div>

          <Chip
            label="Registro rapido"
            sx={{
              backgroundColor: "#dbeafe",
              color: "#003b95",
              fontWeight: 800,
              mb: 2.5,
            }}
          />

          <Typography color="#0f172a" fontWeight={900} sx={{ fontSize: { md: 34, xs: 28 }, lineHeight: 1.08 }}>
            Crea tu cuenta
          </Typography>
          <Typography className="mt-3 max-w-md" color="text.secondary">
            Unete y empieza a reservar en segundos. Tu cuenta tambien te permite seguir el estado de cada reserva.
          </Typography>

          <Stack mt={6} spacing={2}>
            {[
              "Reserva moteles en Bucaramanga desde una sola vista.",
              "Mantiene tus fechas y datos listos para nuevas reservas.",
              "Flujo visual mas claro para clientes y operacion interna.",
            ].map((item) => (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3" key={item}>
                <Typography color="text.secondary">{item}</Typography>
              </div>
            ))}
          </Stack>
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
            Crear tu cuenta
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Completa tus datos y empieza a reservar.
          </Typography>

          <Stack spacing={2.5}>
            {error && <Alert severity="error">{error}</Alert>}

            <Stack direction={{ md: "row", xs: "column" }} spacing={2}>
              <AuthField
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineRoundedIcon sx={{ color: "#94a3b8" }} />
                    </InputAdornment>
                  ),
                }}
                label="Nombre *"
                onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                placeholder="Juan"
                value={form.firstName}
              />
              <AuthField
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineRoundedIcon sx={{ color: "#94a3b8" }} />
                    </InputAdornment>
                  ),
                }}
                label="Apellido *"
                onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                placeholder="Perez"
                value={form.lastName}
              />
            </Stack>

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
                    <LocalPhoneOutlinedIcon sx={{ color: "#94a3b8" }} />
                  </InputAdornment>
                ),
              }}
              label="Telefono"
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder="+57 300 123 4567"
              value={form.phone}
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
              placeholder="Minimo 8 caracteres"
              type="password"
              value={form.password}
            />

            <AuthField
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <KeyRoundedIcon sx={{ color: "#94a3b8" }} />
                  </InputAdornment>
                ),
              }}
              label="Confirmar contrasena *"
              onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
              placeholder="Repite tu contrasena"
              type="password"
              value={form.confirmPassword}
            />

            <Button
              onClick={async () => {
                if (form.password !== form.confirmPassword) {
                  setError("Las contrasenas no coinciden.");
                  return;
                }

                try {
                  await register({
                    firstName: form.firstName,
                    lastName: form.lastName,
                    email: form.email,
                    phone: form.phone,
                    password: form.password,
                  });
                  navigate("/my-bookings");
                } catch (requestError: any) {
                  setError(requestError.response?.data?.message || "No fue posible crear la cuenta.");
                }
              }}
              size="large"
              startIcon={<PersonAddAlt1RoundedIcon />}
              sx={{ borderRadius: "14px", fontWeight: 800, py: 1.6 }}
              variant="contained"
            >
              Crear cuenta
            </Button>
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Typography color="text.secondary" textAlign="center">
            Ya tienes cuenta? <Link to="/login">Inicia sesion</Link>
          </Typography>
        </Paper>
      </div>
    </Box>
  );
}
