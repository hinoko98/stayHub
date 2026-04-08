import { useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { HotelAccessHubDialog } from "./HotelAccessHubDialog";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const [hotelAccessAnchor, setHotelAccessAnchor] = useState<HTMLElement | null>(null);

  return (
    <Box minHeight="100vh">
      <AppBar
        elevation={0}
        sx={{
          backgroundColor: "#003b95",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <Toolbar className="mx-auto flex w-full max-w-7xl gap-3">
          <Box alignItems="center" component={Link} display="flex" gap={1.5} sx={{ color: "white", flexGrow: 1 }} to="/">
            <Box
              sx={{
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.14)",
                borderRadius: "14px",
                display: "flex",
                height: 36,
                justifyContent: "center",
                width: 36,
              }}
            >
              <LockOutlinedIcon fontSize="small" />
            </Box>
            <Typography sx={{ fontWeight: 800 }} variant="h6">
              StayHub
            </Typography>
          </Box>

          <Button component={Link} sx={{ color: "white", fontWeight: 700 }} to="/">
            Explorar moteles
          </Button>

         
          {session?.user.role === "CUSTOMER" && (
            <Button component={Link} sx={{ color: "white", fontWeight: 700 }} to="/my-bookings">
              Mis reservas
            </Button>
          )}

          {session && session.user.role !== "CUSTOMER" && (
            <Button component={Link} sx={{ color: "white", fontWeight: 700 }} to="/management">
              Panel motel
            </Button>
          )}

          {session ? (
            <>
              <Chip
                label={`${session.user.firstName} ${session.user.lastName}`}
                size="small"
                sx={{
                  border: "1px solid rgba(255,255,255,0.28)",
                  color: "white",
                }}
                variant="outlined"
              />
              <Button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                sx={{
                  backgroundColor: "white",
                  color: "#003b95",
                  fontWeight: 700,
                }}
                variant="contained"
              >
                Salir
              </Button>
            </>
          ) : (
            <>
              <Button component={Link} sx={{ color: "white", fontWeight: 700 }} to="/login">
                Iniciar sesion
              </Button>
              <Button
                component={Link}
                sx={{
                  backgroundColor: "white",
                  color: "#003b95",
                  fontWeight: 700,
                  px: 2.5,
                }}
                to="/register"
                variant="contained"
              >
                Registrarse
              </Button>
            </>
          )}
           {!session && (
            <Tooltip title="Acceso hoteles">
              <IconButton
                onClick={(event) => setHotelAccessAnchor(event.currentTarget)}
                sx={{
                  border: "1px solid rgba(255,255,255,0.28)",
                  borderRadius: "14px",
                  color: "white",
                  height: 42,
                  width: 42,
                }}
              >
                <ApartmentRoundedIcon />
              </IconButton>
            </Tooltip>
          )}

        </Toolbar>
      </AppBar>

      <HotelAccessHubDialog
        anchorEl={hotelAccessAnchor}
        onClose={() => setHotelAccessAnchor(null)}
        open={Boolean(hotelAccessAnchor)}
      />

      <Container maxWidth="xl" sx={{ pt: 12, pb: 6 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
