const express = require("express");
const { hotelOf, prisma, ApiError, ACTIVE_BOOKING_STATUSES, reservationDto, buildBookingReference, calculateNights, normalizeDate } = require("./internal-common");

const router = express.Router();

async function clientOf(req, id) {
  const hotel = await hotelOf(req);
  const client = await prisma.client.findFirst({ where: { id, hotelId: hotel.id } });
  if (!client) throw new ApiError(404, "Cliente no encontrado.");
  return client;
}
async function roomOf(req, id) {
  const hotel = await hotelOf(req);
  const room = await prisma.room.findFirst({ where: { id, hotelId: hotel.id } });
  if (!room) throw new ApiError(404, "Habitacion no encontrada.");
  return room;
}
async function reservationOf(req, id) {
  const hotel = await hotelOf(req);
  const reservation = await prisma.booking.findFirst({ where: { id, hotelId: hotel.id }, include: { client: true, room: true, createdBy: true, payments: true, guestsList: { include: { guest: true } } } });
  if (!reservation) throw new ApiError(404, "Reserva no encontrada.");
  return reservation;
}
async function ensureAvailability(hotelId, roomId, checkIn, checkOut, excludeId) {
  const conflict = await prisma.booking.findFirst({ where: { hotelId, roomId, status: { in: ACTIVE_BOOKING_STATUSES }, ...(excludeId ? { id: { not: excludeId } } : {}), AND: [{ checkIn: { lt: checkOut } }, { checkOut: { gt: checkIn } }] } });
  if (conflict) throw new ApiError(400, "La habitacion ya tiene una reserva activa en esas fechas.");
}
async function replaceGuests(reservationId, guestIds) {
  await prisma.bookingGuest.deleteMany({ where: { bookingId: reservationId } });
  if (guestIds.length) await prisma.bookingGuest.createMany({ data: guestIds.map((guestId) => ({ bookingId: reservationId, guestId })) });
}
async function syncRoom(roomId) {
  const room = await prisma.room.findUnique({ where: { id: roomId }, include: { bookings: { where: { status: { in: ACTIVE_BOOKING_STATUSES }, checkOut: { gt: new Date() } } } } });
  if (!room) return;
  if (room.maintenanceStatus === "BLOCKED" || ["MAINTENANCE", "OUT_OF_SERVICE"].includes(room.generalStatus)) return;
  const occupied = room.bookings.some((item) => item.status === "CHECKED_IN");
  const reserved = room.bookings.some((item) => ["PENDING", "CONFIRMED"].includes(item.status));
  const generalStatus = occupied ? "OCCUPIED" : room.generalStatus === "CLEANING" ? "CLEANING" : reserved ? "RESERVED" : "AVAILABLE";
  const status = generalStatus === "OCCUPIED" ? "OCCUPIED" : generalStatus === "CLEANING" ? "CLEANING" : ["MAINTENANCE", "OUT_OF_SERVICE"].includes(generalStatus) ? "MAINTENANCE" : "AVAILABLE";
  await prisma.room.update({ where: { id: roomId }, data: { generalStatus, status } });
}
async function buildReservation(req, payload, current = null) {
  const hotel = await hotelOf(req);
  const client = await clientOf(req, Number(payload.clientId ?? current.clientId));
  const room = await roomOf(req, Number(payload.roomId ?? current.roomId));
  const guestIds = payload.guestIds !== undefined ? payload.guestIds : current?.guestsList?.map((item) => item.guestId) || [];
  const guests = await prisma.guest.findMany({ where: { hotelId: hotel.id, id: { in: guestIds } } });
  if (guests.length !== guestIds.length) throw new ApiError(404, "Uno o varios huespedes no existen.");
  const checkIn = normalizeDate(payload.checkInDate ?? current.checkIn);
  const checkOut = normalizeDate(payload.checkOutDate ?? current.checkOut);
  await ensureAvailability(hotel.id, room.id, checkIn, checkOut, current?.id);
  const nights = calculateNights(checkIn, checkOut);
  const totalGuests = Number(payload.totalGuests ?? current?.guests ?? guestIds.length + 1);
  const adultCount = Number(payload.adultCount ?? (guestIds.length ? 1 + guests.filter((item) => !item.isMinor).length : current?.adultCount ?? totalGuests));
  const minorCount = Number(payload.minorCount ?? (guestIds.length ? guests.filter((item) => item.isMinor).length : current?.minorCount ?? 0));
  if (adultCount + minorCount !== totalGuests) throw new ApiError(400, "La suma de adultos y menores debe coincidir con el total de huespedes.");
  if (totalGuests > room.maxCapacity) throw new ApiError(400, "La reserva supera la capacidad maxima de la habitacion.");
  const pricePerNight = Number(payload.pricePerNight ?? current?.pricePerNight ?? room.pricePerNight);
  const taxes = Number(payload.taxes ?? current?.taxes ?? 0);
  const discounts = Number(payload.discounts ?? current?.discounts ?? 0);
  const advancePaid = Number(payload.advancePaid ?? current?.advancePaid ?? 0);
  const subtotal = pricePerNight * nights;
  const totalPrice = Math.max(0, subtotal + taxes - discounts);
  return { guestIds, data: { reference: current?.reference || buildBookingReference(), hotelId: hotel.id, roomId: room.id, customerId: current?.customerId || null, clientId: client.id, createdById: current?.createdById || req.user.id, guestName: `${client.firstName} ${client.lastName}`.trim(), guestEmail: client.email || current?.guestEmail || `${req.user.email}`, guestPhone: client.primaryPhone, guests: totalGuests, adultCount, minorCount, checkIn, checkOut, estimatedArrivalTime: payload.estimatedArrivalTime ?? current?.estimatedArrivalTime ?? null, nights, pricePerNight, subtotal, taxes, discounts, totalPrice, advancePaid, pendingBalance: Math.max(0, totalPrice - advancePaid), status: payload.status ?? current?.status ?? "CONFIRMED", origin: payload.origin ?? current?.origin ?? "FRONT_DESK", observations: payload.observations ?? current?.observations ?? null, specialRequests: payload.observations ?? current?.specialRequests ?? null, groupNotes: payload.groupNotes ?? current?.groupNotes ?? null, emergencyGroupNotes: payload.emergencyGroupNotes ?? current?.emergencyGroupNotes ?? null, requiresSpecialCare: payload.requiresSpecialCare ?? current?.requiresSpecialCare ?? false } };
}

router.get("/", async (req, res, next) => {
  try {
    const hotel = await hotelOf(req);
    const items = await prisma.booking.findMany({ where: { hotelId: hotel.id }, include: { client: true, room: true, createdBy: true, guestsList: { include: { guest: true } }, payments: true }, orderBy: { createdAt: "desc" } });
    res.json({ items: items.map((item) => reservationDto(item)) });
  } catch (error) { next(error); }
});
router.get("/:id", async (req, res, next) => { try { res.json(reservationDto(await reservationOf(req, Number(req.params.id)))); } catch (error) { next(error); } });
router.post("/", async (req, res, next) => { try { const { data, guestIds } = await buildReservation(req, req.body); const reservation = await prisma.booking.create({ data }); await replaceGuests(reservation.id, guestIds); await syncRoom(reservation.roomId); res.status(201).json(reservationDto(await reservationOf(req, reservation.id))); } catch (error) { next(error); } });
router.put("/:id", async (req, res, next) => { try { const current = await reservationOf(req, Number(req.params.id)); if (current.status === "COMPLETED") throw new ApiError(400, "No se puede editar una reserva finalizada."); const { data, guestIds } = await buildReservation(req, req.body, current); await prisma.booking.update({ where: { id: current.id }, data }); if (req.body.guestIds !== undefined) await replaceGuests(current.id, guestIds); if (current.roomId !== data.roomId) await syncRoom(current.roomId); await syncRoom(data.roomId); res.json(reservationDto(await reservationOf(req, current.id))); } catch (error) { next(error); } });
router.post("/:id/check-in", async (req, res, next) => { try { const reservation = await reservationOf(req, Number(req.params.id)); if (reservation.actualCheckInAt) throw new ApiError(400, "La reserva ya tiene check-in registrado."); if (["CANCELLED", "NO_SHOW"].includes(reservation.status)) throw new ApiError(400, "La reserva no esta disponible para check-in."); await prisma.booking.update({ where: { id: reservation.id }, data: { status: "CHECKED_IN", actualCheckInAt: new Date(), managedById: req.user.id } }); await prisma.room.update({ where: { id: reservation.roomId }, data: { generalStatus: "OCCUPIED", status: "OCCUPIED", cleaningStatus: "PENDING" } }); await syncRoom(reservation.roomId); res.json(reservationDto(await reservationOf(req, reservation.id))); } catch (error) { next(error); } });
router.post("/:id/check-out", async (req, res, next) => { try { const reservation = await reservationOf(req, Number(req.params.id)); if (!reservation.actualCheckInAt) throw new ApiError(400, "No se puede hacer check-out sin check-in previo."); if (reservation.actualCheckOutAt) throw new ApiError(400, "La reserva ya tiene check-out registrado."); await prisma.booking.update({ where: { id: reservation.id }, data: { status: "COMPLETED", actualCheckOutAt: new Date(), managedById: req.user.id } }); await prisma.room.update({ where: { id: reservation.roomId }, data: { generalStatus: "CLEANING", status: "CLEANING", cleaningStatus: "PENDING" } }); await syncRoom(reservation.roomId); res.json(reservationDto(await reservationOf(req, reservation.id))); } catch (error) { next(error); } });

module.exports = router;
