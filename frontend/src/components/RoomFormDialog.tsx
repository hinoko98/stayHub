import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import type { Room, RoomStatus } from "../types";

type RoomInput = {
  name: string;
  code: string;
  type: string;
  capacity: string;
  pricePerNight: string;
  description: string;
  amenities: string;
  status: RoomStatus;
};

const EMPTY_FORM: RoomInput = {
  name: "",
  code: "",
  type: "",
  capacity: "2",
  pricePerNight: "",
  description: "",
  amenities: "",
  status: "AVAILABLE",
};

export function RoomFormDialog({
  open,
  room,
  onClose,
  onSubmit,
}: {
  open: boolean;
  room: Room | null;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [form, setForm] = useState<RoomInput>(EMPTY_FORM);

  useEffect(() => {
    if (room) {
      setForm({
        name: room.name,
        code: room.code,
        type: room.type,
        capacity: String(room.capacity),
        pricePerNight: String(room.pricePerNight),
        description: room.description || "",
        amenities: room.amenities || "",
        status: room.status,
      });
      return;
    }

    setForm(EMPTY_FORM);
  }, [room, open]);

  const update = (field: keyof RoomInput, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle>{room ? "Editar habitacion" : "Nueva habitacion"}</DialogTitle>
      <DialogContent>
        <Stack mt={1} spacing={2}>
          <TextField label="Nombre" onChange={(event) => update("name", event.target.value)} value={form.name} />
          <Stack direction={{ md: "row", xs: "column" }} spacing={2}>
            <TextField label="Codigo" onChange={(event) => update("code", event.target.value)} value={form.code} />
            <TextField label="Tipo" onChange={(event) => update("type", event.target.value)} value={form.type} />
          </Stack>
          <Stack direction={{ md: "row", xs: "column" }} spacing={2}>
            <TextField
              label="Capacidad"
              onChange={(event) => update("capacity", event.target.value)}
              type="number"
              value={form.capacity}
            />
            <TextField
              label="Precio por noche"
              onChange={(event) => update("pricePerNight", event.target.value)}
              type="number"
              value={form.pricePerNight}
            />
          </Stack>
          <TextField
            label="Estado"
            onChange={(event) => update("status", event.target.value)}
            select
            value={form.status}
          >
            <MenuItem value="AVAILABLE">Disponible</MenuItem>
            <MenuItem value="OCCUPIED">Ocupada</MenuItem>
            <MenuItem value="CLEANING">Limpieza</MenuItem>
            <MenuItem value="MAINTENANCE">Mantenimiento</MenuItem>
          </TextField>
          <TextField
            label="Amenidades"
            onChange={(event) => update("amenities", event.target.value)}
            value={form.amenities}
          />
          <TextField
            label="Descripcion"
            minRows={3}
            multiline
            onChange={(event) => update("description", event.target.value)}
            value={form.description}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={() =>
            onSubmit({
              ...form,
              capacity: Number(form.capacity),
              pricePerNight: Number(form.pricePerNight),
            })
          }
          variant="contained"
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
