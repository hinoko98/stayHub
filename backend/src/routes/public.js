const express = require("express");
const { z } = require("zod");
const { prisma } = require("../config/prisma");
const { allowRoles, requireAuth } = require("../middlewares/auth");
const { ApiError } = require("../utils/api-error");
const { buildBookingReference, calculateNights, normalizeDate } = require("../utils/booking");

const router = express.Router();

const bookingSchema = z.object({
  hotelId: z.coerce.number().int().positive(),
  roomId: z.coerce.number().int().positive(),
  guestName: z.string().min(3),
  guestEmail: z.string().email(),
  guestPhone: z.string().optional(),
  guests: z.coerce.number().int().min(1).max(8),
  checkIn: z.string(),
  checkOut: z.string(),
  specialRequests: z.string().max(400).optional(),
});

const ACTIVE_BOOKING_STATUSES = ["PENDING", "CONFIRMED", "CHECKED_IN"];

async function ensureRoomAvailable(roomId, checkIn, checkOut, excludeBookingId) {
  const conflict = await prisma.booking.findFirst({
    where: {
      roomId,
      status: { in: ACTIVE_BOOKING_STATUSES },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      AND: [{ checkIn: { lt: checkOut } }, { checkOut: { gt: checkIn } }],
    },
  });

  if (conflict) {
    throw new ApiError(400, "La habitacion no esta disponible para esas fechas.");
  }
}

async function findOrCreateClient({ hotelId, user, payload }) {
  const existingClient = await prisma.client.findFirst({
    where: {
      hotelId,
      OR: [{ email: payload.guestEmail.toLowerCase() }, { primaryPhone: payload.guestPhone || user.phone || "" }],
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingClient) {
    return prisma.client.update({
      where: { id: existingClient.id },
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        primaryPhone: payload.guestPhone || user.phone || existingClient.primaryPhone,
        email: payload.guestEmail.toLowerCase(),
      },
    });
  }

  return prisma.client.create({
    data: {
      hotelId,
      firstName: user.firstName,
      lastName: user.lastName,
      primaryPhone: payload.guestPhone || user.phone || "Sin telefono",
      email: payload.guestEmail.toLowerCase(),
      city: user.hotel?.city || null,
      country: "Colombia",
    },
  });
}

router.get("/hotels", async (req, res, next) => {
  try {
    const query = String(req.query.q || "").trim();
    const city = String(req.query.city || "").trim();

    const hotels = await prisma.hotel.findMany({
      where: {
        active: true,
        ...(city ? { city: { contains: city } } : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query } },
                { description: { contains: query } },
                { neighborhood: { contains: query } },
              ],
            }
          : {}),
      },
      include: {
        rooms: {
          where: { active: true },
          orderBy: [{ pricePerNight: "asc" }],
        },
      },
      orderBy: [{ rating: "desc" }, { stars: "desc" }],
    });

    res.json(hotels);
  } catch (error) {
    next(error);
  }
});

router.get("/hotels/:slug", async (req, res, next) => {
  try {
    const hotel = await prisma.hotel.findUnique({
      where: { slug: req.params.slug },
      include: {
        rooms: {
          where: { active: true },
          orderBy: [{ pricePerNight: "asc" }],
        },
      },
    });

    if (!hotel || !hotel.active) {
      throw new ApiError(404, "Hotel no encontrado.");
    }

    res.json(hotel);
  } catch (error) {
    next(error);
  }
});

router.post("/bookings", requireAuth, allowRoles("CUSTOMER"), async (req, res, next) => {
  try {
    const payload = bookingSchema.parse(req.body);
    const room = await prisma.room.findUnique({
      where: { id: payload.roomId },
      include: { hotel: true },
    });

    if (!room || !room.active || room.hotelId !== payload.hotelId) {
      throw new ApiError(404, "Habitacion no encontrada.");
    }

    if (["MAINTENANCE", "OUT_OF_SERVICE"].includes(room.generalStatus)) {
      throw new ApiError(400, "La habitacion esta en mantenimiento.");
    }

    if (payload.guests > room.maxCapacity) {
      throw new ApiError(400, "La reserva supera la capacidad de la habitacion.");
    }

    const checkIn = normalizeDate(payload.checkIn);
    const checkOut = normalizeDate(payload.checkOut);
    const nights = calculateNights(checkIn, checkOut);

    await ensureRoomAvailable(payload.roomId, checkIn, checkOut);

    const client = await findOrCreateClient({
      hotelId: room.hotelId,
      user: req.user,
      payload,
    });

    const totalPrice = room.pricePerNight * nights;

    const booking = await prisma.booking.create({
      data: {
        reference: buildBookingReference(),
        hotelId: payload.hotelId,
        roomId: payload.roomId,
        customerId: req.user.id,
        clientId: client.id,
        guestName: payload.guestName,
        guestEmail: payload.guestEmail.toLowerCase(),
        guestPhone: payload.guestPhone,
        guests: payload.guests,
        adultCount: payload.guests,
        minorCount: 0,
        checkIn,
        checkOut,
        nights,
        pricePerNight: room.pricePerNight,
        subtotal: totalPrice,
        totalPrice,
        pendingBalance: totalPrice,
        specialRequests: payload.specialRequests,
        observations: payload.specialRequests,
        origin: "WEB",
        createdById: req.user.id,
      },
      include: {
        hotel: true,
        room: true,
      },
    });

    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
