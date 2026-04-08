import { Alert, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Booking } from "../types";

export function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState("");

  const loadBookings = async () => {
    try {
      const { data } = await api.get<Booking[]>("/me/bookings");
      setBookings(data);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "No fue posible cargar tus reservas.");
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4">Mis reservas</Typography>
        <Typography color="text.secondary">Consulta el estado de tus reservas y cancela las que aun no han sido atendidas.</Typography>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      {bookings.map((booking) => (
        <Card key={booking.id}>
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Typography variant="h6">{booking.hotel.name}</Typography>
              <Typography color="text.secondary">
                {booking.room.name} · {format(new Date(booking.checkIn), "dd MMM yyyy", { locale: es })} al{" "}
                {format(new Date(booking.checkOut), "dd MMM yyyy", { locale: es })}
              </Typography>
              <Typography color="text.secondary">
                Reserva {booking.reference} · {booking.guests} huespedes · ${booking.totalPrice.toLocaleString("es-CO")}
              </Typography>
            </div>

            <Stack alignItems={{ md: "flex-end", xs: "flex-start" }} spacing={1}>
              <Chip color={booking.status === "CONFIRMED" ? "success" : "default"} label={booking.status} />
              {["PENDING", "CONFIRMED"].includes(booking.status) && (
                <Button
                  color="error"
                  onClick={async () => {
                    await api.put(`/me/bookings/${booking.id}/cancel`);
                    loadBookings();
                  }}
                  variant="outlined"
                >
                  Cancelar
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
