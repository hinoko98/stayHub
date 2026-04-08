import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { MotelDateRangeField } from "./MotelDateRangeField";
import type { Hotel, Room } from "../types";

interface BookingDialogProps {
  hotel: Hotel;
  room: Room | null;
  open: boolean;
  onClose: () => void;
}

export function BookingDialog({ hotel, room, open, onClose }: BookingDialogProps) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    guestName: session ? `${session.user.firstName} ${session.user.lastName}` : "",
    guestEmail: session?.user.email || "",
    guestPhone: session?.user.phone || "",
    guests: "2",
    checkIn: "",
    checkOut: "",
    specialRequests: "",
  });

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!room) {
      return;
    }

    setError("");
    setSaving(true);

    try {
      await api.post("/public/bookings", {
        hotelId: hotel.id,
        roomId: room.id,
        ...form,
        guests: Number(form.guests),
      });
      onClose();
      navigate("/my-bookings");
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "No fue posible crear la reserva.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle>Reservar {room?.name}</DialogTitle>
      <DialogContent>
        <Stack mt={1} spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Nombre del huesped"
            onChange={(event) => handleChange("guestName", event.target.value)}
            value={form.guestName}
          />
          <TextField
            label="Correo"
            onChange={(event) => handleChange("guestEmail", event.target.value)}
            type="email"
            value={form.guestEmail}
          />
          <TextField
            label="Telefono"
            onChange={(event) => handleChange("guestPhone", event.target.value)}
            value={form.guestPhone}
          />
          <MotelDateRangeField
            checkIn={form.checkIn}
            checkOut={form.checkOut}
            compact
            onChange={({ checkIn, checkOut }) => setForm((current) => ({ ...current, checkIn, checkOut }))}
          />
          <TextField
            label="Numero de huespedes"
            onChange={(event) => handleChange("guests", event.target.value)}
            type="number"
            value={form.guests}
          />
          <TextField
            label="Solicitudes especiales"
            minRows={3}
            multiline
            onChange={(event) => handleChange("specialRequests", event.target.value)}
            value={form.specialRequests}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button disabled={saving} onClick={handleSubmit} variant="contained">
          Confirmar reserva
        </Button>
      </DialogActions>
    </Dialog>
  );
}
