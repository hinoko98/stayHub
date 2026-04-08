import { Alert, Button, Card, CardContent, Chip, Divider, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useEffect } from "react";
import { BookingDialog } from "../components/BookingDialog";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { Hotel, Room } from "../types";

export function HotelDetailPage() {
  const { slug } = useParams();
  const { session } = useAuth();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [error, setError] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  useEffect(() => {
    async function loadMotel() {
      try {
        const { data } = await api.get<Hotel>(`/public/hotels/${slug}`);
        setHotel(data);
      } catch (requestError: any) {
        setError(requestError.response?.data?.message || "No fue posible cargar el motel.");
      }
    }

    loadMotel();
  }, [slug]);

  const amenityList = useMemo(() => (hotel?.amenities || "").split(",").filter(Boolean), [hotel]);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!hotel) {
    return <Typography>Cargando motel...</Typography>;
  }

  return (
    <Stack spacing={4}>
      <section className="overflow-hidden rounded-[32px] bg-white shadow-sm">
        <img
          alt={hotel.name}
          className="h-[360px] w-full object-cover"
          src={hotel.coverImage || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80"}
        />
        <div className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <Typography variant="h4">{hotel.name}</Typography>
            <Typography color="text.secondary">
              {hotel.city} · {hotel.address}
            </Typography>
            <Typography className="mt-4" color="text.secondary">
              {hotel.description}
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1} mt={3}>
              {amenityList.map((item) => (
                <Chip key={item} label={item} />
              ))}
            </Stack>
          </div>

          <Stack alignItems="flex-start" spacing={1}>
            <Chip color="secondary" label={`${hotel.stars} estrellas`} />
            <Chip color="primary" label={`Rating ${hotel.rating.toFixed(1)}`} variant="outlined" />
          </Stack>
        </div>
      </section>

      <div>
        <Typography mb={1} variant="h5">
          Suites y habitaciones
        </Typography>
        <Typography color="text.secondary">
          Selecciona una suite y crea la reserva desde la misma vista.
        </Typography>
      </div>

      <Stack spacing={3}>
        {hotel.rooms?.map((room) => (
          <Card key={room.id}>
            <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <Typography variant="h6">{room.name}</Typography>
                <Typography color="text.secondary">
                  {room.code} · {room.type} · Capacidad {room.capacity}
                </Typography>
                <Typography className="mt-2" color="text.secondary">
                  {room.description}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {(room.amenities || "").split(",").filter(Boolean).map((item) => (
                    <Chip key={item} label={item} size="small" />
                  ))}
                </Stack>
              </div>

              <Stack alignItems={{ md: "flex-end", xs: "flex-start" }} spacing={2}>
                <Typography fontWeight={800} variant="h6">
                  ${room.pricePerNight.toLocaleString("es-CO")} / noche
                </Typography>
                {session?.user.role === "CUSTOMER" ? (
                  <Button onClick={() => setSelectedRoom(room)} variant="contained">
                    Reservar suite
                  </Button>
                ) : (
                  <Button component={Link} to="/login" variant="outlined">
                    Inicia sesion para reservar
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <BookingDialog hotel={hotel} onClose={() => setSelectedRoom(null)} open={Boolean(selectedRoom)} room={selectedRoom} />
    </Stack>
  );
}
