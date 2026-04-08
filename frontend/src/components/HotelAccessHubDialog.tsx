import {
  Box,
  IconButton,
  Popover,
  Stack,
  Typography,
} from "@mui/material";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { useNavigate } from "react-router-dom";

type HotelAccessHubDialogProps = {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  open: boolean;
};

type MenuRowProps = {
  description?: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
};

function MenuRow({ description, icon, label, onClick }: MenuRowProps) {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        alignItems: "center",
        backgroundColor: "transparent",
        border: "none",
        borderRadius: "16px",
        cursor: "pointer",
        display: "grid",
        gap: 1.5,
        gridTemplateColumns: "40px 1fr auto",
        p: 1.2,
        textAlign: "left",
        transition: "background-color 0.18s ease",
        width: "100%",
        "&:hover": {
          backgroundColor: "#f8fafc",
        },
      }}
      type="button"
    >
      <Box
        sx={{
          alignItems: "center",
          border: "1px solid #dbe3f0",
          borderRadius: "999px",
          color: "#111827",
          display: "flex",
          height: 40,
          justifyContent: "center",
          width: 40,
        }}
      >
        {icon}
      </Box>

      <Box>
        <Typography color="#111827" fontWeight={600}>
          {label}
        </Typography>
        {description ? (
          <Typography color="text.secondary" sx={{ mt: 0.25 }} variant="body2">
            {description}
          </Typography>
        ) : null}
      </Box>

      <ArrowForwardIosRoundedIcon sx={{ color: "#94a3b8", fontSize: 16 }} />
    </Box>
  );
}

export function HotelAccessHubDialog({ anchorEl, onClose, open }: HotelAccessHubDialogProps) {
  const navigate = useNavigate();

  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          sx: {
            borderRadius: "18px",
            boxShadow: "0 20px 45px rgba(15, 23, 42, 0.24)",
            mt: 1.2,
            overflow: "hidden",
            width: 350,
          },
        },
      }}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
    >
      <Box sx={{ backgroundColor: "white", p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Typography color="#111827" fontWeight={800} variant="h6">
            Acceso hoteles
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Typography color="text.secondary" sx={{ mb: 2, mt: 0.5 }} variant="body2">
          Configuracion y ayuda para el acceso interno de los moteles.
        </Typography>

        <Typography color="#111827" fontWeight={800} sx={{ mb: 1 }}>
          Gestion motelera
        </Typography>
        <Stack spacing={0.4}>
          <MenuRow
            description="Entrar al panel del hotel para habitaciones y reservas."
            icon={<SettingsRoundedIcon fontSize="small" />}
            label="Configuracion de moteles"
            onClick={() => {
              onClose();
              navigate("/acceso-hoteles");
            }}
          />
        </Stack>

        <Typography color="#111827" fontWeight={800} sx={{ mb: 1, mt: 2.2 }}>
          Ayuda
        </Typography>
        <Stack spacing={0.4}>
          <MenuRow
            description="Soporte para accesos, claves y activacion de cuentas."
            icon={<SupportAgentRoundedIcon fontSize="small" />}
            label="Soporte hotelero"
            onClick={() => {
              onClose();
              navigate("/acceso-hoteles");
            }}
          />
        </Stack>
      </Box>
    </Popover>
  );
}
