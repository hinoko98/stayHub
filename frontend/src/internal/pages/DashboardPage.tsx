import { useEffect, useState } from "react";
import { fetchDetail } from "../services/resources";
import { KpiCard } from "../components/ui/KpiCard";
import { Panel } from "../components/ui/Panel";
import { StatusPill } from "../components/ui/StatusPill";

type DashboardReservation = {
  id: number;
  code: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  totalGuests: number;
  client: { firstName: string; lastName: string } | null;
  room: { number: string };
};

type BoardRoom = {
  id: number;
  number: string;
  floor: number | null;
  type: string;
  bedCount: number;
  bedType: string | null;
  maxCapacity: number;
  basePrice: number;
  seasonalPrice: number | null;
  operationalStatus: string;
  reservation: {
    id: number;
    code: string;
    status: string;
    checkInDate: string;
    checkOutDate: string;
    totalGuests: number;
    client: { firstName: string; lastName: string } | null;
  } | null;
};

type FloorBoard = {
  floor: number;
  label: string;
  totals: {
    total: number;
    available: number;
    reserved: number;
    occupied: number;
    cleaning: number;
    maintenance: number;
  };
  rooms: BoardRoom[];
};

type DashboardSummary = {
  cards: Record<string, number>;
  hotelBoard: {
    totalRooms: number;
    totalFloors: number;
    floors: FloorBoard[];
  };
  reservationsToday: DashboardReservation[];
  upcomingDepartures: Array<{
    id: number;
    code: string;
    checkOutDate: string;
    client: { firstName: string; lastName: string };
    room: { number: string };
  }>;
};

const labels: Record<string, string> = {
  availableRooms: "Disponibles",
  reservedRooms: "Reservadas",
  occupiedRooms: "Ocupadas",
  cleaningRooms: "En limpieza",
  maintenanceRooms: "Mantenimiento",
  reservationsToday: "Reservas de hoy",
  checkInsToday: "Check-ins",
  checkOutsToday: "Check-outs",
  todayIncome: "Ingresos del dia",
  pendingPayments: "Pagos pendientes",
  currentOccupation: "Ocupacion %",
  currentGuests: "Huespedes alojados",
  cancelledReservations: "Canceladas",
};

const legendStatuses = ["AVAILABLE", "RESERVED", "OCCUPIED", "CLEANING", "MAINTENANCE"] as const;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

const formatGuestName = (guest: { firstName: string; lastName: string } | null | undefined) =>
  guest ? `${guest.firstName} ${guest.lastName}` : "Sin asignar";

const getRoomStayText = (room: BoardRoom) => {
  if (!room.reservation) {
    return "Sin reserva activa";
  }

  const start = new Date(room.reservation.checkInDate).toLocaleDateString("es-CO");
  const end = new Date(room.reservation.checkOutDate).toLocaleDateString("es-CO");

  return `${start} - ${end}`;
};

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string>("ALL");

  useEffect(() => {
    fetchDetail<DashboardSummary>("/dashboard/summary").then(setSummary).catch(() => undefined);
  }, []);

  const visibleFloors =
    summary?.hotelBoard.floors.filter((floor) => selectedFloor === "ALL" || String(floor.floor) === selectedFloor) ||
    [];

  return (
    <div className="page-grid dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Tablero operativo</p>
          <h2>Control visual de reservas y habitaciones por piso</h2>
          <p>
            Consulta en una sola vista las 24 habitaciones del hotel, distribuidas en 3 pisos, con su estado
            operativo, tipo de cama y reserva activa.
          </p>

          <div className="dashboard-summary-strip">
            <div className="summary-chip">
              <strong>{summary?.hotelBoard.totalFloors ?? 0}</strong>
              <span>Pisos</span>
            </div>
            <div className="summary-chip">
              <strong>{summary?.hotelBoard.totalRooms ?? 0}</strong>
              <span>Habitaciones</span>
            </div>
            <div className="summary-chip">
              <strong>{summary?.cards.currentOccupation ?? 0}%</strong>
              <span>Ocupacion actual</span>
            </div>
          </div>
        </div>

        <div className="dashboard-hero-side">
          <div className="board-legend">
            {legendStatuses.map((status) => (
              <div key={status} className={`legend-item legend-${status.toLowerCase()}`}>
                <span className="legend-dot" />
                <StatusPill value={status} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="kpi-grid">
        {summary &&
          Object.entries(summary.cards).map(([key, value]) => (
            <KpiCard
              key={key}
              label={labels[key] || key}
              value={key === "todayIncome" ? formatCurrency(value) : value}
              tone={
                key === "availableRooms" || key === "todayIncome"
                  ? "success"
                  : key === "reservedRooms" || key === "cleaningRooms"
                    ? "warning"
                    : key === "maintenanceRooms" || key === "cancelledReservations"
                      ? "danger"
                      : "neutral"
              }
            />
          ))}
      </section>

      <Panel
        title="Mapa de habitaciones"
        description="El tablero resalta disponibilidad, reservas, ocupacion, limpieza y mantenimiento por planta."
        actions={
          <select value={selectedFloor} onChange={(event) => setSelectedFloor(event.target.value)}>
            <option value="ALL">Todos los pisos</option>
            {summary?.hotelBoard.floors.map((floor) => (
              <option key={floor.floor} value={String(floor.floor)}>
                {floor.label}
              </option>
            ))}
          </select>
        }
      >
        <div className="floor-stack">
          {visibleFloors.map((floor) => (
            <section key={floor.floor} className="floor-section">
              <header className="floor-header">
                <div>
                  <h3>{floor.label}</h3>
                  <p>{floor.totals.total} habitaciones operativas en este nivel.</p>
                </div>

                <div className="floor-stats">
                  <span>{floor.totals.available} disponibles</span>
                  <span>{floor.totals.reserved} reservadas</span>
                  <span>{floor.totals.occupied} ocupadas</span>
                </div>
              </header>

              <div className="room-board-grid">
                {floor.rooms.map((room) => (
                  <article
                    key={room.id}
                    className={`room-card room-${room.operationalStatus.toLowerCase().replace(/_/g, "-")}`}
                  >
                    <div className="room-card-top">
                      <span className="room-number">Hab. {room.number}</span>
                      <StatusPill value={room.operationalStatus} />
                    </div>

                    <strong>{room.type}</strong>
                    <p className="room-bedline">{room.bedType || `${room.bedCount} camas`} </p>

                    <div className="room-meta">
                      <span>{room.maxCapacity} huespedes</span>
                      <span>{formatCurrency(room.seasonalPrice || room.basePrice)}</span>
                    </div>

                    <div className={`room-reservation ${room.reservation ? "" : "room-reservation-empty"}`}>
                      <small>{room.reservation ? room.reservation.code : "Disponible para nueva reserva"}</small>
                      <strong>{formatGuestName(room.reservation?.client)}</strong>
                      <span>{getRoomStayText(room)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Panel>

      <div className="dashboard-secondary-grid">
        <Panel title="Reservas de hoy" description="Seguimiento rapido de entradas previstas para la jornada.">
          <div className="list-stack">
            {summary?.reservationsToday.map((reservation) => (
              <div className="list-item" key={reservation.id}>
                <div>
                  <strong>{reservation.code}</strong>
                  <p>
                    {formatGuestName(reservation.client)} - Hab. {reservation.room.number}
                  </p>
                </div>
                <StatusPill value={reservation.status} />
              </div>
            ))}

            {summary?.reservationsToday.length === 0 && (
              <p className="empty-state">No hay entradas programadas para hoy.</p>
            )}
          </div>
        </Panel>

        <Panel title="Proximas salidas" description="Habitaciones que requeriran cierre y coordinacion de limpieza.">
          <div className="list-stack">
            {summary?.upcomingDepartures.map((reservation) => (
              <div className="list-item" key={reservation.id}>
                <div>
                  <strong>{reservation.code}</strong>
                  <p>
                    {reservation.client.firstName} {reservation.client.lastName} - Hab. {reservation.room.number}
                  </p>
                </div>
                <span>{new Date(reservation.checkOutDate).toLocaleDateString("es-CO")}</span>
              </div>
            ))}

            {summary?.upcomingDepartures.length === 0 && (
              <p className="empty-state">No hay salidas pendientes en este momento.</p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
