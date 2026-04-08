import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Panel } from "../components/ui/Panel";
import { StatusPill } from "../components/ui/StatusPill";
import { fetchList } from "../services/resources";

type RoomItem = {
  id: number;
  number: string;
  floor: number | null;
  type: string;
  bedCount: number;
  bedType: string | null;
  maxCapacity: number;
  basePrice: number;
  seasonalPrice: number | null;
  generalStatus: string;
};

const buildRoomNumber = (floor: number | null, roomNumber: string) => {
  if (!floor) {
    return roomNumber;
  }

  return roomNumber.startsWith(String(floor)) ? roomNumber : `${floor}${roomNumber.padStart(2, "0")}`;
};

export function RoomsPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState("ALL");
  const [selectedBedType, setSelectedBedType] = useState("ALL");

  useEffect(() => {
    const loadRooms = async () => {
      setLoading(true);

      try {
        const response = await fetchList<RoomItem>("/rooms?limit=100");
        const items = (response.items || []).map((room) => ({
          ...room,
          number: buildRoomNumber(room.floor, room.number),
        }));

        setRooms(items);
      } finally {
        setLoading(false);
      }
    };

    loadRooms().catch(() => undefined);
  }, []);

  const bedTypes = useMemo(
    () => [...new Set(rooms.map((room) => room.bedType).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b)),
    [rooms],
  );

  const floors = useMemo(
    () => [...new Set(rooms.map((room) => room.floor).filter((value): value is number => value !== null))].sort((a, b) => a - b),
    [rooms],
  );

  const filteredRooms = useMemo(
    () =>
      rooms.filter((room) => {
        const matchesFloor = selectedFloor === "ALL" || String(room.floor) === selectedFloor;
        const matchesBedType = selectedBedType === "ALL" || room.bedType === selectedBedType;
        return matchesFloor && matchesBedType;
      }),
    [rooms, selectedBedType, selectedFloor],
  );

  return (
    <div className="page-grid room-ops-page">
      <Panel
        title="Tablero de habitaciones"
        helpText="Aqui puedes filtrar y seleccionar una habitacion disponible para abrir su ficha de reserva."
      >
        <div className="room-toolbar">
          <label className="field">
            <span>Filtrar por piso</span>
            <select value={selectedFloor} onChange={(event) => setSelectedFloor(event.target.value)}>
              <option value="ALL">Todos</option>
              {floors.map((floor) => (
                <option key={floor} value={String(floor)}>
                  Piso {floor}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Filtrar por tipo de cama</span>
            <select value={selectedBedType} onChange={(event) => setSelectedBedType(event.target.value)}>
              <option value="ALL">Todas</option>
              {bedTypes.map((bedType) => (
                <option key={bedType} value={bedType}>
                  {bedType}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <p className="empty-state">Cargando habitaciones...</p>
        ) : filteredRooms.length === 0 ? (
          <p className="empty-state">
            No hay habitaciones registradas o no coinciden con los filtros. Crea el inventario desde Configuracion.
          </p>
        ) : (
          <div className="room-ops-grid">
            {filteredRooms.map((room) => (
              <button
                key={room.id}
                className={`room-ops-card room-ops-${room.generalStatus.toLowerCase().replace(/_/g, "-")}`}
                onClick={() => navigate(`/management/rooms/${room.id}/reserva`)}
                type="button"
              >
                <div className="room-ops-card-top">
                  <strong>{room.number}</strong>
                  <StatusPill value={room.generalStatus} />
                </div>
                <span>Piso {room.floor || "N/A"}</span>
                <span>{room.bedType || `${room.bedCount} camas`}</span>
                <span>Capacidad: {room.maxCapacity} huespedes</span>
                <small>{room.type}</small>
                <small>Abrir ficha de reserva</small>
              </button>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
