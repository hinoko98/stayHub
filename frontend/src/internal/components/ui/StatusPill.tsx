type StatusPillProps = {
  value: string | null | undefined;
};

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  AVAILABLE: "Disponible",
  CANCELLED: "Cancelada",
  CHECKED_IN: "Check-in",
  CLEAN: "Limpia",
  CLEANING: "Limpieza",
  CLOSED: "Cerrado",
  COMPLETED: "Finalizada",
  CONFIRMED: "Confirmada",
  INACTIVE: "Inactivo",
  IN_PROGRESS: "En proceso",
  MAINTENANCE: "Mantenimiento",
  N_A: "N/A",
  NO_SHOW: "No asistio",
  NORMAL: "Normal",
  OCCUPIED: "Ocupada",
  OPEN: "Abierto",
  OUT_OF_SERVICE: "Fuera de servicio",
  PAID: "Pagado",
  PARTIAL: "Parcial",
  PENDING: "Pendiente",
  REFUNDED: "Reembolsado",
  RESERVED: "Reservada",
  REVIEW: "Revision",
  VOID: "Anulado",
};

export const getStatusLabel = (value: string | null | undefined) => {
  const rawValue = value || "N/A";
  const normalizedValue = rawValue.replace(/\s+/g, "_").toUpperCase();
  return STATUS_LABELS[normalizedValue] || rawValue;
};

export function StatusPill({ value }: StatusPillProps) {
  const rawValue = value || "N/A";
  const normalizedValue = rawValue.replace(/\s+/g, "_").toUpperCase();
  const tone = normalizedValue.toLowerCase();
  const label = getStatusLabel(rawValue);

  return <span className={`status-pill status-${tone.replace(/_/g, "-")}`}>{label}</span>;
}
