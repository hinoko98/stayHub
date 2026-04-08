import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HelpHint } from "../components/ui/HelpHint";
import { Panel } from "../components/ui/Panel";
import { StatusPill, getStatusLabel } from "../components/ui/StatusPill";
import { createResource, fetchDetail, postResource, updateResource } from "../services/resources";

type RoomDetail = {
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
  reservations?: Array<{ id: number; code: string; status: string }>;
};

type ReservationDetail = {
  id: number;
  code: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  estimatedArrivalTime: string | null;
  pricePerNight: number;
  total: number;
  advancePaid: number;
  pendingBalance: number;
  observations: string | null;
  client: {
    id: number;
    firstName: string;
    lastName: string;
    documentType: string;
    documentNumber: string;
    primaryPhone: string;
    email: string | null;
    city: string | null;
    country: string | null;
    notes: string | null;
  };
  guests: Array<{
    guest: {
      id: number;
      firstName: string;
      lastName: string;
      documentType: string;
      documentNumber: string | null;
      relationToClient: string | null;
      phone: string | null;
      isMinor: boolean;
    };
  }>;
  payments: Array<{ id: number; method: string; amountPaid: number; status: string }>;
};

type CompanionForm = {
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  relationToClient: string;
  phone: string;
  isMinor: boolean;
};

const initialClientForm = {
  firstName: "",
  lastName: "",
  documentType: "CC",
  documentNumber: "",
  primaryPhone: "",
  email: "",
  city: "",
  country: "Colombia",
  notes: "",
};

const initialReservationForm = {
  checkInDate: "",
  checkOutDate: "",
  estimatedArrivalTime: "",
  pricePerNight: "",
  observations: "",
  advancePaid: 0,
  paymentMethod: "CASH",
  paymentReference: "",
  paymentNotes: "",
  reservationStatus: "CONFIRMED",
};

const activeStatuses = ["PENDING", "CONFIRMED", "CHECKED_IN"];

const createCompanion = (): CompanionForm => ({
  firstName: "",
  lastName: "",
  documentType: "CC",
  documentNumber: "",
  relationToClient: "",
  phone: "",
  isMinor: false,
});

const emptyToNull = (value: string) => (value.trim() ? value.trim() : null);
const toIsoDate = (value: string, hour: string) => new Date(`${value}T${hour}:00`).toISOString();
const formatDate = (value: string) => new Date(value).toISOString().slice(0, 10);
const buildRoomNumber = (floor: number | null, roomNumber: string) =>
  floor && !roomNumber.startsWith(String(floor)) ? `${floor}${roomNumber.padStart(2, "0")}` : roomNumber;
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(value || 0));

export function RoomReservationPage() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [clientForm, setClientForm] = useState(initialClientForm);
  const [companions, setCompanions] = useState<CompanionForm[]>([]);
  const [reservationForm, setReservationForm] = useState(initialReservationForm);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const latestPayment = useMemo(
    () => (reservation ? [...reservation.payments].sort((a, b) => b.id - a.id)[0] || null : null),
    [reservation],
  );

  const loadRoom = async () => {
    if (!roomId) return;
    setLoading(true);
    setLoadError("");
    try {
      const roomResponse = await fetchDetail<RoomDetail>(`/rooms/${roomId}`);
      const nextRoom = { ...roomResponse, number: buildRoomNumber(roomResponse.floor, roomResponse.number) };
      setRoom(nextRoom);
      const active = (nextRoom.reservations || []).find((item) => activeStatuses.includes(item.status));
      if (active) {
        const reservationResponse = await fetchDetail<ReservationDetail>(`/reservations/${active.id}`);
        const currentPayment = [...reservationResponse.payments].sort((a, b) => b.id - a.id)[0] || null;
        setReservation(reservationResponse);
        setClientForm({
          firstName: reservationResponse.client.firstName || "",
          lastName: reservationResponse.client.lastName || "",
          documentType: reservationResponse.client.documentType || "CC",
          documentNumber: reservationResponse.client.documentNumber || "",
          primaryPhone: reservationResponse.client.primaryPhone || "",
          email: reservationResponse.client.email || "",
          city: reservationResponse.client.city || "",
          country: reservationResponse.client.country || "Colombia",
          notes: reservationResponse.client.notes || "",
        });
        setReservationForm({
          checkInDate: formatDate(reservationResponse.checkInDate),
          checkOutDate: formatDate(reservationResponse.checkOutDate),
          estimatedArrivalTime: reservationResponse.estimatedArrivalTime || "",
          pricePerNight: String(reservationResponse.pricePerNight),
          observations: reservationResponse.observations || "",
          advancePaid: 0,
          paymentMethod: currentPayment?.method || "CASH",
          paymentReference: "",
          paymentNotes: "",
          reservationStatus: reservationResponse.status,
        });
      } else {
        setReservation(null);
        setClientForm(initialClientForm);
        setCompanions([]);
        setReservationForm({ ...initialReservationForm, pricePerNight: String(nextRoom.seasonalPrice || nextRoom.basePrice) });
      }
    } catch (error: any) {
      setLoadError(error?.response?.data?.message || "No fue posible cargar la habitacion.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoom().catch(() => undefined);
  }, [roomId]);

  const handleNewCompanionChange = (index: number, field: keyof CompanionForm, value: string | boolean) => {
    setCompanions((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!room) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      if (reservation) {
        await updateResource(`/clients/${reservation.client.id}`, {
          firstName: clientForm.firstName,
          lastName: clientForm.lastName,
          documentType: clientForm.documentType,
          documentNumber: clientForm.documentNumber,
          primaryPhone: clientForm.primaryPhone,
          email: emptyToNull(clientForm.email),
          city: emptyToNull(clientForm.city),
          country: emptyToNull(clientForm.country),
          notes: emptyToNull(clientForm.notes),
        });
        await updateResource(`/reservations/${reservation.id}`, {
          clientId: reservation.client.id,
          roomId: room.id,
          checkInDate: toIsoDate(reservationForm.checkInDate, "15:00"),
          checkOutDate: toIsoDate(reservationForm.checkOutDate, "12:00"),
          estimatedArrivalTime: emptyToNull(reservationForm.estimatedArrivalTime),
          pricePerNight: Number(reservationForm.pricePerNight),
          advancePaid: reservation.advancePaid,
          observations: emptyToNull(reservationForm.observations),
          status: reservationForm.reservationStatus,
        });
        if (Number(reservationForm.advancePaid) > 0) {
          await createResource("/payments", {
            reservationId: reservation.id,
            amountPaid: Number(reservationForm.advancePaid),
            type: "ADVANCE",
            method: reservationForm.paymentMethod,
            reference: emptyToNull(reservationForm.paymentReference),
            notes: emptyToNull(reservationForm.paymentNotes),
          });
        }
        setFeedback({ type: "success", message: "Reserva actualizada correctamente." });
      } else {
        const client = await createResource<{ id: number }, Record<string, unknown>>("/clients", {
          firstName: clientForm.firstName,
          lastName: clientForm.lastName,
          documentType: clientForm.documentType,
          documentNumber: clientForm.documentNumber,
          primaryPhone: clientForm.primaryPhone,
          email: emptyToNull(clientForm.email),
          city: emptyToNull(clientForm.city),
          country: emptyToNull(clientForm.country),
          notes: emptyToNull(clientForm.notes),
        });
        const guestIds: number[] = [];
        const validCompanions = companions.filter((item) => item.firstName.trim() && item.lastName.trim());
        for (const companion of validCompanions) {
          const guest = await createResource<{ id: number }, Record<string, unknown>>("/guests", {
            firstName: companion.firstName,
            lastName: companion.lastName,
            documentType: companion.documentType,
            documentNumber: emptyToNull(companion.documentNumber),
            relationToClient: emptyToNull(companion.relationToClient),
            phone: emptyToNull(companion.phone),
            isMinor: companion.isMinor,
          });
          guestIds.push(guest.id);
        }
        const reservationCreated = await createResource<{ id: number }, Record<string, unknown>>("/reservations", {
          clientId: client.id,
          roomId: room.id,
          checkInDate: toIsoDate(reservationForm.checkInDate, "15:00"),
          checkOutDate: toIsoDate(reservationForm.checkOutDate, "12:00"),
          estimatedArrivalTime: emptyToNull(reservationForm.estimatedArrivalTime),
          totalGuests: 1 + validCompanions.length,
          adultCount: 1 + validCompanions.filter((item) => !item.isMinor).length,
          minorCount: validCompanions.filter((item) => item.isMinor).length,
          pricePerNight: Number(reservationForm.pricePerNight),
          advancePaid: Number(reservationForm.advancePaid || 0),
          observations: emptyToNull(reservationForm.observations),
          status: reservationForm.reservationStatus,
          origin: "FRONT_DESK",
          guestIds,
        });
        if (Number(reservationForm.advancePaid) > 0) {
          await createResource("/payments", {
            reservationId: reservationCreated.id,
            amountPaid: Number(reservationForm.advancePaid),
            type: "ADVANCE",
            method: reservationForm.paymentMethod,
            reference: emptyToNull(reservationForm.paymentReference),
            notes: emptyToNull(reservationForm.paymentNotes),
          });
        }
        setFeedback({ type: "success", message: "Reserva registrada correctamente." });
      }
      await loadRoom();
    } catch (error: any) {
      setFeedback({ type: "error", message: error?.response?.data?.message || "No fue posible guardar la reserva." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReservationAction = async (action: "check-in" | "check-out") => {
    if (!reservation) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await postResource(`/reservations/${reservation.id}/${action}`, {});
      await loadRoom();
      setFeedback({ type: "success", message: action === "check-in" ? "Check-in registrado correctamente." : "Check-out registrado correctamente." });
    } catch (error: any) {
      setFeedback({ type: "error", message: error?.response?.data?.message || "No fue posible completar la accion." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-grid"><Panel title="Reserva" helpText="Cargando los datos de la habitacion seleccionada."><p className="empty-state">Cargando habitacion...</p></Panel></div>;
  if (!room) return <div className="page-grid"><Panel title="Reserva" helpText="No se pudo abrir la ficha de reserva." actions={<button className="ghost-button" onClick={() => navigate("/management/rooms")} type="button">Volver al tablero</button>}><p className="empty-state">{loadError || "La habitacion solicitada no existe."}</p></Panel></div>;

  const peopleCount = reservation ? 1 + reservation.guests.length : 1 + companions.filter((item) => item.firstName.trim() && item.lastName.trim()).length;

  return (
    <div className="page-grid room-ops-page">
      <Panel
        title={reservation ? `Modificar reserva de la habitacion ${room.number}` : `Reserva para habitacion ${room.number}`}
        helpText="Desde aqui puedes crear una reserva nueva, editar la reserva activa y registrar check-in o check-out."
        actions={<button className="ghost-button" onClick={() => navigate("/management/rooms")} type="button">Volver al tablero</button>}
      >
        <div className="selected-room-summary">
          <div className="selected-room-summary-card"><span>Habitacion</span><strong>{room.number}</strong></div>
          <div className="selected-room-summary-card"><span>Piso</span><strong>{room.floor}</strong></div>
          <div className="selected-room-summary-card"><span>Tipo de cama</span><strong>{room.bedType || `${room.bedCount} camas`}</strong></div>
          <div className="selected-room-summary-card"><span>Capacidad</span><strong>{room.maxCapacity} huespedes</strong></div>
          <div className="selected-room-summary-card"><span>Tarifa</span><strong>{formatCurrency(room.seasonalPrice || room.basePrice)}</strong></div>
          <div className="selected-room-summary-card"><span>Estado</span><StatusPill value={room.generalStatus} /></div>
        </div>

        {reservation && (
          <div className="current-room-alert">
            La habitacion se encuentra {getStatusLabel(room.generalStatus).toLowerCase()}, pero aqui puedes modificar la reserva activa y registrar el check-in o check-out del cliente.
          </div>
        )}

        <form className="reservation-workspace" onSubmit={handleSubmit}>
          <section className="reservation-column">
            <div className="reservation-block">
              <div className="reservation-block-header"><div><div className="panel-title-row"><h3>Cliente principal</h3><HelpHint text="Datos del responsable principal de la reserva." /></div></div></div>
              <div className="form-grid">
                <label className="field"><span>Nombres</span><input required value={clientForm.firstName} onChange={(event) => setClientForm((current) => ({ ...current, firstName: event.target.value }))} /></label>
                <label className="field"><span>Apellidos</span><input required value={clientForm.lastName} onChange={(event) => setClientForm((current) => ({ ...current, lastName: event.target.value }))} /></label>
                <label className="field"><span>Tipo de documento</span><select value={clientForm.documentType} onChange={(event) => setClientForm((current) => ({ ...current, documentType: event.target.value }))}><option value="CC">CC</option><option value="CE">CE</option><option value="TI">TI</option><option value="PASSPORT">Pasaporte</option><option value="OTHER">Otro</option></select></label>
                <label className="field"><span>Numero de documento</span><input required value={clientForm.documentNumber} onChange={(event) => setClientForm((current) => ({ ...current, documentNumber: event.target.value }))} /></label>
                <label className="field"><span>Telefono</span><input required value={clientForm.primaryPhone} onChange={(event) => setClientForm((current) => ({ ...current, primaryPhone: event.target.value }))} /></label>
                <label className="field"><span>Correo</span><input type="email" value={clientForm.email} onChange={(event) => setClientForm((current) => ({ ...current, email: event.target.value }))} /></label>
                <label className="field"><span>Ciudad</span><input value={clientForm.city} onChange={(event) => setClientForm((current) => ({ ...current, city: event.target.value }))} /></label>
                <label className="field"><span>Pais</span><input value={clientForm.country} onChange={(event) => setClientForm((current) => ({ ...current, country: event.target.value }))} /></label>
                <label className="field field-wide"><span>Notas</span><textarea value={clientForm.notes} onChange={(event) => setClientForm((current) => ({ ...current, notes: event.target.value }))} /></label>
              </div>
            </div>

            <div className="reservation-block">
              <div className="reservation-block-header"><div><div className="panel-title-row"><h3>{reservation ? "Huespedes asociados" : "Acompanantes"}</h3><HelpHint text={reservation ? "Lista actual de huespedes vinculados a la reserva." : "Agrega otros huespedes vinculados a la misma reserva."} /></div></div>{!reservation && <button className="ghost-button" onClick={() => setCompanions((current) => [...current, createCompanion()])} type="button">Agregar huesped</button>}</div>
              <div className="companions-stack">
                {reservation ? (
                  reservation.guests.length === 0 ? <p className="empty-state">Sin huespedes adicionales.</p> : reservation.guests.map((item) => <article className="companion-card" key={item.guest.id}><div className="companion-card-header"><strong>{item.guest.firstName} {item.guest.lastName}</strong><StatusPill value={item.guest.isMinor ? "Revision" : "Activo"} /></div><div className="history-grid"><div><span>Documento</span><strong>{item.guest.documentNumber || "Sin documento"}</strong></div><div><span>Relacion</span><strong>{item.guest.relationToClient || "Sin relacion"}</strong></div><div><span>Telefono</span><strong>{item.guest.phone || "Sin telefono"}</strong></div></div></article>)
                ) : (
                  <>
                    {companions.length === 0 && <p className="empty-state">Sin acompanantes agregados.</p>}
                    {companions.map((companion, index) => (
                      <article className="companion-card" key={`${index}-${companion.firstName}`}>
                        <div className="companion-card-header"><strong>Huesped #{index + 1}</strong><button className="ghost-button" onClick={() => setCompanions((current) => current.filter((_, itemIndex) => itemIndex !== index))} type="button">Quitar</button></div>
                        <div className="form-grid">
                          <label className="field"><span>Nombres</span><input value={companion.firstName} onChange={(event) => handleNewCompanionChange(index, "firstName", event.target.value)} /></label>
                          <label className="field"><span>Apellidos</span><input value={companion.lastName} onChange={(event) => handleNewCompanionChange(index, "lastName", event.target.value)} /></label>
                          <label className="field"><span>Tipo de documento</span><select value={companion.documentType} onChange={(event) => handleNewCompanionChange(index, "documentType", event.target.value)}><option value="CC">CC</option><option value="CE">CE</option><option value="TI">TI</option><option value="PASSPORT">Pasaporte</option><option value="OTHER">Otro</option></select></label>
                          <label className="field"><span>Numero de documento</span><input value={companion.documentNumber} onChange={(event) => handleNewCompanionChange(index, "documentNumber", event.target.value)} /></label>
                          <label className="field"><span>Relacion</span><input value={companion.relationToClient} onChange={(event) => handleNewCompanionChange(index, "relationToClient", event.target.value)} /></label>
                          <label className="field"><span>Telefono</span><input value={companion.phone} onChange={(event) => handleNewCompanionChange(index, "phone", event.target.value)} /></label>
                          <label className="field field-checkbox"><span>Menor de edad</span><input type="checkbox" checked={companion.isMinor} onChange={(event) => handleNewCompanionChange(index, "isMinor", event.target.checked)} /></label>
                        </div>
                      </article>
                    ))}
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="reservation-column">
            <div className="reservation-block">
              <div className="reservation-block-header"><div><div className="panel-title-row"><h3>Reserva y pago</h3><HelpHint text="Completa fechas, tarifa, adelanto y metodo de pago." /></div></div></div>
              <div className="form-grid">
                <label className="field"><span>Fecha de entrada</span><input required type="date" value={reservationForm.checkInDate} onChange={(event) => setReservationForm((current) => ({ ...current, checkInDate: event.target.value }))} /></label>
                <label className="field"><span>Fecha de salida</span><input required type="date" value={reservationForm.checkOutDate} onChange={(event) => setReservationForm((current) => ({ ...current, checkOutDate: event.target.value }))} /></label>
                <label className="field"><span>Hora estimada de llegada</span><input value={reservationForm.estimatedArrivalTime} onChange={(event) => setReservationForm((current) => ({ ...current, estimatedArrivalTime: event.target.value }))} /></label>
                <label className="field"><span>Estado de la reserva</span><select value={reservationForm.reservationStatus} onChange={(event) => setReservationForm((current) => ({ ...current, reservationStatus: event.target.value }))}><option value="PENDING">Pendiente</option><option value="CONFIRMED">Confirmada</option><option value="CHECKED_IN">Check-in</option><option value="CANCELLED">Cancelada</option><option value="NO_SHOW">No asistio</option></select></label>
                <label className="field"><span>Precio por noche</span><input required min="0" type="number" value={reservationForm.pricePerNight} onChange={(event) => setReservationForm((current) => ({ ...current, pricePerNight: event.target.value }))} /></label>
                <label className="field"><span>{reservation ? "Abono adicional" : "Adelanto"}</span><input min="0" type="number" value={reservationForm.advancePaid} onChange={(event) => setReservationForm((current) => ({ ...current, advancePaid: Number(event.target.value || 0) }))} /></label>
                <label className="field"><span>Metodo de pago</span><select value={reservationForm.paymentMethod} onChange={(event) => setReservationForm((current) => ({ ...current, paymentMethod: event.target.value }))}><option value="CASH">Efectivo</option><option value="DEBIT_CARD">Tarjeta debito</option><option value="CREDIT_CARD">Tarjeta credito</option><option value="TRANSFER">Transferencia</option><option value="QR">QR</option><option value="MIXED">Mixto</option></select></label>
                <label className="field"><span>Referencia</span><input value={reservationForm.paymentReference} onChange={(event) => setReservationForm((current) => ({ ...current, paymentReference: event.target.value }))} /></label>
                <label className="field field-wide"><span>Observaciones</span><textarea value={reservationForm.observations} onChange={(event) => setReservationForm((current) => ({ ...current, observations: event.target.value }))} /></label>
                <label className="field field-wide"><span>Notas del pago</span><textarea value={reservationForm.paymentNotes} onChange={(event) => setReservationForm((current) => ({ ...current, paymentNotes: event.target.value }))} /></label>
              </div>
              {reservation && <div className="history-grid"><div><span>Codigo</span><strong>{reservation.code}</strong></div><div><span>Total</span><strong>{formatCurrency(reservation.total)}</strong></div><div><span>Abonado</span><strong>{formatCurrency(reservation.advancePaid)}</strong></div><div><span>Saldo</span><strong>{formatCurrency(reservation.pendingBalance)}</strong></div></div>}
            </div>

            <div className="reservation-actions">
              <div className="reservation-actions-copy"><strong>Total de personas previstas</strong><span>{peopleCount}</span></div>
              <div className="form-actions">
                {reservation && ["PENDING", "CONFIRMED"].includes(reservation.status) && <button className="ghost-button" disabled={submitting} onClick={() => handleReservationAction("check-in")} type="button">Registrar check-in</button>}
                {reservation?.status === "CHECKED_IN" && <button className="ghost-button" disabled={submitting} onClick={() => handleReservationAction("check-out")} type="button">Registrar check-out</button>}
                <button className="primary-button" disabled={submitting} type="submit">{submitting ? "Guardando..." : reservation ? "Guardar cambios de la reserva" : "Registrar reserva completa"}</button>
              </div>
              {latestPayment && <span className="form-success">Ultimo pago: {formatCurrency(latestPayment.amountPaid)} - {getStatusLabel(latestPayment.status)}</span>}
              {feedback && <span className={feedback.type === "success" ? "form-success" : "form-error"}>{feedback.message}</span>}
            </div>
          </section>
        </form>
      </Panel>
    </div>
  );
}
