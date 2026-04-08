import {
  Alert,
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import TagRoundedIcon from "@mui/icons-material/TagRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import FlashOnRoundedIcon from "@mui/icons-material/FlashOnRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { addDays, format } from "date-fns";
import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { HotelCard } from "../components/HotelCard";
import { MotelDateRangeField } from "../components/MotelDateRangeField";
import { api } from "../lib/api";
import type { Hotel } from "../types";

const FEATURE_ITEMS = [
  {
    icon: <TagRoundedIcon sx={{ color: "#f59e0b", fontSize: 34 }} />,
    title: "Mejor tarifa visible",
    description: "Consulta moteles en Bucaramanga con una vista clara del precio base por noche.",
  },
  {
    icon: <LockOutlinedIcon sx={{ color: "#f59e0b", fontSize: 34 }} />,
    title: "Reservas discretas",
    description: "La reserva queda registrada en el sistema y el motel la gestiona desde su panel interno.",
  },
  {
    icon: <FlashOnRoundedIcon sx={{ color: "#f97316", fontSize: 34 }} />,
    title: "Confirmacion rapida",
    description: "El buscador, el detalle y la reserva viven en la misma experiencia.",
  },
  {
    icon: <SupportAgentRoundedIcon sx={{ color: "#94a3b8", fontSize: 34 }} />,
    title: "Operacion por motel",
    description: "Cada sede administra sus habitaciones y reservas sin mezclar informacion.",
  },
];

export function HomePage() {
  const [motels, setMotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [checkIn, setCheckIn] = useState(format(new Date(), "yyyy-MM-dd"));
  const [checkOut, setCheckOut] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [guests, setGuests] = useState("2 adultos - 0 ninos - 1 habitacion");
  const [activeFilter, setActiveFilter] = useState("");
  const deferredFilter = useDeferredValue(activeFilter);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadMotels() {
      try {
        const { data } = await api.get<Hotel[]>("/public/hotels");
        startTransition(() => setMotels(data.filter((item) => item.city.toLowerCase().includes("bucaramanga"))));
      } catch (requestError: any) {
        setError(requestError.response?.data?.message || "No fue posible cargar los moteles.");
      } finally {
        setLoading(false);
      }
    }

    loadMotels();
  }, []);

  const filteredMotels = useMemo(() => {
    const normalizedFilter = deferredFilter.trim().toLowerCase();

    if (!normalizedFilter) {
      return motels;
    }

    return motels.filter((motel) => {
      const haystack = `${motel.name} ${motel.city} ${motel.neighborhood || ""} ${motel.address}`.toLowerCase();
      return haystack.includes(normalizedFilter);
    });
  }, [deferredFilter, motels]);

  const featuredMotels = useMemo(
    () => [...filteredMotels].sort((a, b) => b.rating - a.rating).slice(0, 6),
    [filteredMotels],
  );

  const sectors = useMemo(() => {
    const sectorMap = new Map<string, { name: string; count: number; image: string }>();

    motels.forEach((motel) => {
      const key = motel.neighborhood || "Bucaramanga";
      const current = sectorMap.get(key);

      if (current) {
        current.count += 1;
        return;
      }

      sectorMap.set(key, {
        name: key,
        count: 1,
        image:
          motel.coverImage || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
      });
    });

    return Array.from(sectorMap.values()).slice(0, 4);
  }, [motels]);

  const totalRooms = motels.reduce((total, motel) => total + (motel.rooms?.length || 0), 0);

  const handleSearch = () => {
    setActiveFilter(search);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Stack spacing={0}>
      <section className="page-bleed overflow-hidden bg-[#003b95] text-white">
        <div className="relative min-h-[74vh] bg-[url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&q=80')] bg-cover bg-center">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,59,149,0.78),rgba(23,37,84,0.9))]" />
          <div className="relative mx-auto flex max-w-7xl flex-col px-6 pb-10 pt-10 md:px-10 md:pb-16 md:pt-16">
            <div className="hero-rise mx-auto max-w-4xl text-center">
              <Typography sx={{ fontSize: { md: 56, xs: 36 }, fontWeight: 900, lineHeight: 1.05 }}>
                Descubre los mejores moteles en{" "}
                <Box component="span" sx={{ color: "#febb02" }}>
                  Bucaramanga
                </Box>
              </Typography>
              <Typography className="mx-auto mt-4 max-w-2xl text-white/85" sx={{ fontSize: { md: 24, xs: 18 } }}>
                Reserva con confianza. Tarifas visibles, fechas claras y gestion local para cada motel.
              </Typography>
            </div>

            <div className="hero-rise-delayed mt-8 flex justify-center gap-8 text-center md:mt-10">
              <div>
                <Typography sx={{ color: "#febb02", fontSize: 34, fontWeight: 800 }}>{motels.length}+</Typography>
                <Typography className="text-white/75">Moteles</Typography>
              </div>
              <div>
                <Typography sx={{ color: "#febb02", fontSize: 34, fontWeight: 800 }}>{totalRooms}+</Typography>
                <Typography className="text-white/75">Habitaciones</Typography>
              </div>
              <div>
                <Typography sx={{ color: "#febb02", fontSize: 34, fontWeight: 800 }}>300+</Typography>
                <Typography className="text-white/75">Comentarios</Typography>
              </div>
            </div>

            <div className="hero-rise-delayed mx-auto mt-10 w-full max-w-6xl rounded-[18px] border-4 border-[#febb02] bg-white shadow-2xl md:mt-12">
              <div className="grid gap-2 p-2 md:grid-cols-[1.15fr_1.5fr_1.15fr_auto] md:gap-0 md:p-0">
                <TextField
                  InputProps={{
                    startAdornment: <PlaceOutlinedIcon sx={{ color: "#64748b", mr: 1 }} />,
                  }}
                  InputLabelProps={{ shrink: true }}
                  label="Motel o zona"
                  onChange={(event) => setSearch(event.target.value)}
                  sx={{
                    "& .MuiFilledInput-root": { backgroundColor: "transparent" },
                    "& .MuiInputBase-root": { borderRadius: 0, px: 1.5, py: 1.6 },
                  }}
                  value={search}
                  variant="filled"
                />

                <MotelDateRangeField
                  checkIn={checkIn}
                  checkOut={checkOut}
                  label="Fecha de entrada - Fecha de salida"
                  onChange={({ checkIn, checkOut }) => {
                    setCheckIn(checkIn);
                    setCheckOut(checkOut);
                  }}
                />

                <TextField
                  InputProps={{
                    startAdornment: <PersonOutlineOutlinedIcon sx={{ color: "#64748b", mr: 1 }} />,
                  }}
                  InputLabelProps={{ shrink: true }}
                  label="Huespedes"
                  onChange={(event) => setGuests(event.target.value)}
                  select
                  sx={{
                    "& .MuiFilledInput-root": { backgroundColor: "transparent" },
                    "& .MuiInputBase-root": { borderRadius: 0, px: 1.5, py: 1.6 },
                  }}
                  value={guests}
                  variant="filled"
                >
                  <MenuItem value="1 adulto - 0 ninos - 1 habitacion">1 adulto - 0 ninos - 1 habitacion</MenuItem>
                  <MenuItem value="2 adultos - 0 ninos - 1 habitacion">2 adultos - 0 ninos - 1 habitacion</MenuItem>
                  <MenuItem value="2 adultos - 1 nino - 1 habitacion">2 adultos - 1 nino - 1 habitacion</MenuItem>
                  <MenuItem value="3 adultos - 0 ninos - 1 habitacion">3 adultos - 0 ninos - 1 habitacion</MenuItem>
                </TextField>

                <Button
                  onClick={handleSearch}
                  sx={{
                    backgroundColor: "#0071c2",
                    borderRadius: "12px",
                    fontSize: 20,
                    fontWeight: 800,
                    minWidth: 160,
                    mx: 1,
                    my: 1,
                    px: 3,
                    py: 2,
                  }}
                  variant="contained"
                >
                  Buscar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <Box sx={{ mx: "auto", mt: 4, width: "100%", maxWidth: "1200px", px: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      <section className="mx-auto w-full max-w-7xl px-6 py-14 md:px-10">
        <Typography fontWeight={800} variant="h4">
          Explora por sector
        </Typography>
        <Typography color="text.secondary" mt={1}>
          Moteles disponibles solo en Bucaramanga
        </Typography>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {sectors.map((sector) => (
            <button
              className="sector-tile relative overflow-hidden rounded-[18px] text-left"
              key={sector.name}
              onClick={() => {
                setSearch(sector.name);
                setActiveFilter(sector.name);
                resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              type="button"
            >
              <img alt={sector.name} className="h-32 w-full object-cover" src={sector.image} />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.88))]" />
              <div className="absolute bottom-3 left-3">
                <Typography color="white" fontWeight={800}>
                  {sector.name}
                </Typography>
                <Typography color="white" variant="body2">
                  {sector.count} {sector.count === 1 ? "motel" : "moteles"}
                </Typography>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-14 md:px-10" ref={resultsRef}>
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <Typography fontWeight={800} variant="h4">
              Moteles destacados
            </Typography>
            <Typography color="text.secondary">
              Los favoritos para encontrar estadias discretas en Bucaramanga
            </Typography>
          </div>

          <Button onClick={() => setActiveFilter("")} sx={{ color: "#003b95", fontWeight: 700 }}>
            Ver todos
          </Button>
        </div>

        <Stack spacing={3}>
          {(loading ? motels : featuredMotels).map((motel) => (
            <HotelCard hotel={motel} key={motel.id} />
          ))}
        </Stack>
      </section>

      <section className="page-bleed bg-[#eef2ff] py-14">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="text-center">
            <Typography fontWeight={800} variant="h4">
              Por que elegir StayHub?
            </Typography>
            <Typography color="text.secondary" mt={1}>
              Una sola ciudad, un solo enfoque y un buscador mas claro para moteles.
            </Typography>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {FEATURE_ITEMS.map((item) => (
              <div className="feature-panel rounded-[22px] bg-white px-6 py-8 text-center" key={item.title}>
                <div className="mb-4 flex justify-center">{item.icon}</div>
                <Typography fontWeight={800} variant="h6">
                  {item.title}
                </Typography>
                <Typography color="text.secondary" mt={1.5}>
                  {item.description}
                </Typography>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-bleed bg-[#003b95] py-16 text-white">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 text-center md:px-10">
          <Typography fontWeight={900} sx={{ fontSize: { md: 48, xs: 34 }, lineHeight: 1.08 }}>
            Listo para tu proxima reserva?
          </Typography>
          <Typography className="mt-3 max-w-2xl text-white/80" sx={{ fontSize: { md: 22, xs: 18 } }}>
            Crea tu cuenta y gestiona todas tus reservas de moteles en Bucaramanga desde un solo lugar.
          </Typography>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              component={Link}
              sx={{
                backgroundColor: "#febb02",
                borderRadius: "16px",
                color: "#111827",
                fontWeight: 800,
                px: 4,
                py: 1.4,
              }}
              to="/register"
              variant="contained"
            >
              Crear cuenta gratis
            </Button>
            <Button
              onClick={() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              sx={{
                borderColor: "rgba(255,255,255,0.3)",
                borderRadius: "16px",
                color: "white",
                fontWeight: 800,
                px: 4,
                py: 1.4,
              }}
              variant="outlined"
            >
              Explorar moteles
            </Button>
          </div>
        </div>
      </section>
    </Stack>
  );
}
