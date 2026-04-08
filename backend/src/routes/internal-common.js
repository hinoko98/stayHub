const { prisma } = require("../config/prisma");
const { ApiError } = require("../utils/api-error");
const { buildBookingReference, calculateNights, normalizeDate } = require("../utils/booking");

const INTERNAL_ROLES = ["HOTEL_ADMIN", "HOTEL_STAFF", "SUPER_ADMIN", "RECEPTION", "CASHIER", "HOUSEKEEPING"];
const ADMIN_ROLES = ["HOTEL_ADMIN", "SUPER_ADMIN"];
const ACTIVE_BOOKING_STATUSES = ["PENDING", "CONFIRMED", "CHECKED_IN"];

const pageOf = (query) => {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
  return { page, limit, skip: (page - 1) * limit };
};

const usernameOf = (email) => String(email || "").split("@")[0].toLowerCase();
const roomNumber = (room) => room.number || room.code;
const roomStatusFromGeneral = (generalStatus) => {
  if (generalStatus === "OCCUPIED") return "OCCUPIED";
  if (generalStatus === "CLEANING") return "CLEANING";
  if (["MAINTENANCE", "OUT_OF_SERVICE"].includes(generalStatus)) return "MAINTENANCE";
  return "AVAILABLE";
};

const userDto = (user) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  document: user.document,
  phone: user.phone,
  email: user.email,
  username: user.username || usernameOf(user.email),
  role: user.role,
  status: user.status,
  createdAt: user.createdAt,
});

const clientDto = (client) => ({
  id: client.id,
  firstName: client.firstName,
  lastName: client.lastName,
  documentType: client.documentType,
  documentNumber: client.documentNumber,
  primaryPhone: client.primaryPhone,
  email: client.email,
  city: client.city,
  country: client.country,
  notes: client.notes,
  status: client.status,
  createdAt: client.createdAt,
});

const guestDto = (guest) => ({
  id: guest.id,
  firstName: guest.firstName,
  lastName: guest.lastName,
  documentType: guest.documentType,
  documentNumber: guest.documentNumber,
  relationToClient: guest.relationToClient,
  phone: guest.phone,
  isMinor: guest.isMinor,
  status: guest.status,
});

const roomDto = (room, includeReservations = false) => ({
  id: room.id,
  number: roomNumber(room),
  floor: room.floor,
  type: room.type,
  bedCount: room.bedCount,
  bedType: room.bedType,
  maxCapacity: room.maxCapacity,
  basePrice: room.basePrice,
  seasonalPrice: room.seasonalPrice,
  generalStatus: room.generalStatus,
  cleaningStatus: room.cleaningStatus,
  maintenanceStatus: room.maintenanceStatus,
  active: room.active,
  reservations: includeReservations ? (room.bookings || []).map((item) => ({ id: item.id, code: item.reference, status: item.status })) : undefined,
});

const reservationDto = (booking) => ({
  id: booking.id,
  code: booking.reference,
  status: booking.status,
  checkInDate: booking.checkIn,
  checkOutDate: booking.checkOut,
  actualCheckInAt: booking.actualCheckInAt,
  actualCheckOutAt: booking.actualCheckOutAt,
  estimatedArrivalTime: booking.estimatedArrivalTime,
  totalGuests: booking.guests,
  adultCount: booking.adultCount,
  minorCount: booking.minorCount,
  nights: booking.nights,
  pricePerNight: booking.pricePerNight,
  subtotal: booking.subtotal ?? booking.totalPrice,
  taxes: booking.taxes,
  discounts: booking.discounts,
  total: booking.totalPrice,
  advancePaid: booking.advancePaid,
  pendingBalance: booking.pendingBalance,
  origin: booking.origin,
  observations: booking.observations,
  groupNotes: booking.groupNotes,
  emergencyGroupNotes: booking.emergencyGroupNotes,
  requiresSpecialCare: booking.requiresSpecialCare,
  client: booking.client ? clientDto(booking.client) : null,
  room: booking.room ? { number: roomNumber(booking.room) } : null,
  createdBy: booking.createdBy ? userDto(booking.createdBy) : null,
  guests: (booking.guestsList || []).map((item) => ({ guest: guestDto(item.guest), isPrimaryGuest: item.isPrimaryGuest })),
  payments: (booking.payments || []).map((item) => ({ id: item.id, method: item.method, amountPaid: item.amountPaid, status: item.status })),
});

const paymentDto = (payment) => ({
  id: payment.id,
  method: payment.method,
  amountPaid: payment.amountPaid,
  status: payment.status,
  type: payment.type,
  paymentDate: payment.paymentDate,
  reservation: payment.booking ? { code: payment.booking.reference, client: payment.booking.client ? clientDto(payment.booking.client) : null, room: payment.booking.room ? { number: roomNumber(payment.booking.room) } : null } : null,
  registeredBy: payment.registeredBy ? userDto(payment.registeredBy) : null,
});

const ensureAdmin = (req) => {
  if (!ADMIN_ROLES.includes(req.user.role)) throw new ApiError(403, "No tienes permisos para esta accion.");
};

const hotelIdOf = (req) => (req.user.role === "SUPER_ADMIN" && req.query.hotelId ? Number(req.query.hotelId) : req.user.hotelId);
async function hotelOf(req) {
  const id = hotelIdOf(req);
  if (!id && req.user.role === "SUPER_ADMIN") {
    const fallbackHotel = await prisma.hotel.findFirst({
      where: { active: true },
      orderBy: { id: "asc" },
    });

    if (!fallbackHotel) throw new ApiError(404, "No hay hoteles disponibles para el admin general.");
    return fallbackHotel;
  }

  if (!id) throw new ApiError(400, "El usuario no tiene un hotel asignado.");
  const hotel = await prisma.hotel.findUnique({ where: { id } });
  if (!hotel) throw new ApiError(404, "Hotel no encontrado.");
  return hotel;
}

module.exports = { prisma, ApiError, buildBookingReference, calculateNights, normalizeDate, INTERNAL_ROLES, ACTIVE_BOOKING_STATUSES, pageOf, usernameOf, roomNumber, roomStatusFromGeneral, userDto, clientDto, guestDto, roomDto, reservationDto, paymentDto, ensureAdmin, hotelOf, hotelIdOf };
