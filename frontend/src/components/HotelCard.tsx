import { Button, Card, CardContent, CardMedia, Chip, Stack, Typography } from "@mui/material";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { Link } from "react-router-dom";
import type { Hotel } from "../types";

export function HotelCard({ hotel }: { hotel: Hotel }) {
  const amenities = (hotel.amenities || "").split(",").filter(Boolean).slice(0, 4);
  const basePrice = hotel.rooms?.length
    ? hotel.rooms.reduce((min, room) => Math.min(min, room.pricePerNight), Number.MAX_SAFE_INTEGER)
    : null;

  return (
    <Card className="overflow-hidden rounded-[24px] border border-slate-200 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="grid md:grid-cols-[320px_1fr]">
        <CardMedia
          component="img"
          image={hotel.coverImage || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80"}
          sx={{ height: "100%", minHeight: 260 }}
        />

        <CardContent className="flex flex-col gap-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Typography fontWeight={800} variant="h5">
                {hotel.name}
              </Typography>
              <Typography className="flex items-center gap-1" color="text.secondary">
                <PlaceOutlinedIcon sx={{ fontSize: 18 }} />
                {hotel.city} · {hotel.neighborhood || hotel.address}
              </Typography>
            </div>
            <Chip
              icon={<StarRoundedIcon />}
              label={`${hotel.rating.toFixed(1)} · ${hotel.stars} estrellas`}
              sx={{
                backgroundColor: "#eef2ff",
                color: "#4338ca",
                fontWeight: 700,
              }}
            />
          </div>

          <Typography color="text.secondary">{hotel.description}</Typography>

          <Stack direction="row" flexWrap="wrap" gap={1}>
            {amenities.map((item) => (
              <Chip
                key={item}
                label={item}
                size="small"
                sx={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
              />
            ))}
          </Stack>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-4">
            <div>
              <Typography color="text.secondary" variant="body2">
                Tarifa base por noche
              </Typography>
              <Typography fontWeight={800}>
                Desde {basePrice !== null ? `$${basePrice.toLocaleString("es-CO")}` : "Consultar"}
              </Typography>
            </div>

            <Button
              component={Link}
              sx={{
                backgroundColor: "#4338ca",
                borderRadius: "14px",
                fontWeight: 700,
                px: 3,
              }}
              to={`/motels/${hotel.slug}`}
              variant="contained"
            >
              Ver motel
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
