import {
  Alert,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { startTransition, useEffect, useState } from "react";
import { RoomFormDialog } from "../components/RoomFormDialog";
import { api } from "../lib/api";
import type { Booking, Hotel, Room } from "../types";

type SummaryResponse = {
  hotel: Hotel;
  metrics: {
    rooms: number;
    bookings: number;
    activeBookings: number;
    todayCheckIns: number;
  };
};

export function ManagementPage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState("");
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hotelForm, setHotelForm] = useState({
    name: "",
    description: "",
    city: "",
    address: "",
    neighborhood: "",
    stars: "4",
    rating: "8.5",
    coverImage: "",
    amenities: "",
  });

  const refreshData = async () => {
    try {
      const [summaryResponse, hotelResponse, roomResponse, bookingResponse] = await Promise.all([
        api.get<SummaryResponse>("/management/summary"),
        api.get<Hotel>("/management/hotel"),
        api.get<Room[]>("/management/rooms"),
        api.get<Booking[]>("/management/bookings"),
      ]);

      startTransition(() => {
        setSummary(summaryResponse.data);
        setRooms(roomResponse.data);
        setBookings(bookingResponse.data);
        setHotelForm({
          name: hotelResponse.data.name,
          description: hotelResponse.data.description || "",
          city: hotelResponse.data.city,
          address: hotelResponse.data.address,
          neighborhood: hotelResponse.data.neighborhood || "",
          stars: String(hotelResponse.data.stars),
          rating: String(hotelResponse.data.rating),
          coverImage: hotelResponse.data.coverImage || "",
          amenities: hotelResponse.data.amenities || "",
        });
      });
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "No fue posible cargar el panel.");
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <Stack spacing={4}>
      <div>
        <Typography variant="h4">Panel por motel</Typography>
        <Typography color="text.secondary">
          Este panel opera solo sobre el motel asociado al usuario interno.
        </Typography>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <div className="grid gap-4 md:grid-cols-4">
        {summary &&
          [
            { label: "Habitaciones", value: summary.metrics.rooms },
            { label: "Reservas", value: summary.metrics.bookings },
            { label: "Activas", value: summary.metrics.activeBookings },
            { label: "Check-ins hoy", value: summary.metrics.todayCheckIns },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent>
                <Typography color="text.secondary">{item.label}</Typography>
                <Typography fontWeight={800} variant="h4">
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <Typography variant="h6">Perfil del motel</Typography>
              <Button
                onClick={async () => {
                  await api.put("/management/hotel", {
                    ...hotelForm,
                    stars: Number(hotelForm.stars),
                    rating: Number(hotelForm.rating),
                  });
                  refreshData();
                }}
                variant="contained"
              >
                Guardar cambios
              </Button>
            </div>

            <Stack spacing={2}>
              <TextField label="Nombre" onChange={(event) => setHotelForm({ ...hotelForm, name: event.target.value })} value={hotelForm.name} />
              <TextField
                label="Descripcion"
                minRows={4}
                multiline
                onChange={(event) => setHotelForm({ ...hotelForm, description: event.target.value })}
                value={hotelForm.description}
              />
              <Stack direction={{ md: "row", xs: "column" }} spacing={2}>
                <TextField label="Ciudad" onChange={(event) => setHotelForm({ ...hotelForm, city: event.target.value })} value={hotelForm.city} />
                <TextField
                  label="Barrio"
                  onChange={(event) => setHotelForm({ ...hotelForm, neighborhood: event.target.value })}
                  value={hotelForm.neighborhood}
                />
              </Stack>
              <TextField
                label="Direccion"
                onChange={(event) => setHotelForm({ ...hotelForm, address: event.target.value })}
                value={hotelForm.address}
              />
              <Stack direction={{ md: "row", xs: "column" }} spacing={2}>
                <TextField
                  label="Estrellas"
                  onChange={(event) => setHotelForm({ ...hotelForm, stars: event.target.value })}
                  type="number"
                  value={hotelForm.stars}
                />
                <TextField
                  label="Rating"
                  onChange={(event) => setHotelForm({ ...hotelForm, rating: event.target.value })}
                  type="number"
                  value={hotelForm.rating}
                />
              </Stack>
              <TextField
                label="Imagen principal"
                onChange={(event) => setHotelForm({ ...hotelForm, coverImage: event.target.value })}
                value={hotelForm.coverImage}
              />
              <TextField
                label="Amenidades"
                onChange={(event) => setHotelForm({ ...hotelForm, amenities: event.target.value })}
                value={hotelForm.amenities}
              />
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <Typography variant="h6">Habitaciones</Typography>
              <Button
                onClick={() => {
                  setEditingRoom(null);
                  setDialogOpen(true);
                }}
                variant="contained"
              >
                Nueva habitacion
              </Button>
            </div>

            <Stack spacing={2}>
              {rooms.map((room) => (
                <Card key={room.id} variant="outlined">
                  <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <Typography fontWeight={700}>
                        {room.code} · {room.name}
                      </Typography>
                      <Typography color="text.secondary">
                        {room.type} · Capacidad {room.capacity} · ${room.pricePerNight.toLocaleString("es-CO")}
                      </Typography>
                      <Typography color="text.secondary">Estado: {room.status}</Typography>
                    </div>
                    <Button
                      onClick={() => {
                        setEditingRoom(room);
                        setDialogOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <Typography mb={3} variant="h6">
            Reservas del motel
          </Typography>
          <Stack spacing={2}>
            {bookings.map((booking) => (
              <Card key={booking.id} variant="outlined">
                <CardContent className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <Typography fontWeight={700}>
                      {booking.reference} · {booking.guestName}
                    </Typography>
                    <Typography color="text.secondary">
                      {booking.room.name} · {booking.guests} huespedes · ${booking.totalPrice.toLocaleString("es-CO")}
                    </Typography>
                  </div>
                  <TextField
                    onChange={async (event) => {
                      await api.put(`/management/bookings/${booking.id}/status`, {
                        status: event.target.value,
                      });
                      refreshData();
                    }}
                    select
                    size="small"
                    value={booking.status}
                  >
                    {["PENDING", "CONFIRMED", "CANCELLED", "CHECKED_IN", "COMPLETED"].map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </TextField>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <RoomFormDialog
        onClose={() => {
          setDialogOpen(false);
          setEditingRoom(null);
        }}
        onSubmit={async (payload) => {
          if (editingRoom) {
            await api.put(`/management/rooms/${editingRoom.id}`, payload);
          } else {
            await api.post("/management/rooms", payload);
          }
          setDialogOpen(false);
          setEditingRoom(null);
          refreshData();
        }}
        open={dialogOpen}
        room={editingRoom}
      />
    </Stack>
  );
}
