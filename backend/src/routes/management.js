const express = require("express");
const { z } = require("zod");
const { prisma } = require("../config/prisma");
const { allowRoles, requireAuth } = require("../middlewares/auth");
const { ApiError } = require("../utils/api-error");

const router = express.Router();

const hotelSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  city: z.string().min(2),
  address: z.string().min(5),
  neighborhood: z.string().optional(),
  stars: z.coerce.number().int().min(1).max(5),
  rating: z.coerce.number().min(0).max(10),
  coverImage: z.string().url(),
  amenities: z.string().optional(),
});

const roomSchema = z.object({
  name: z.string().min(3),
  code: z.string().min(2),
  type: z.string().min(3),
  capacity: z.coerce.number().int().min(1).max(10),
  pricePerNight: z.coerce.number().positive(),
  description: z.string().optional(),
  amenities: z.string().optional(),
  status: z.enum(["AVAILABLE", "OCCUPIED", "CLEANING", "MAINTENANCE"]),
  active: z.boolean().optional(),
});

const bookingStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "CHECKED_IN", "COMPLETED"]),
});

router.use(requireAuth, allowRoles("HOTEL_ADMIN", "HOTEL_STAFF", "SUPER_ADMIN"));

function getHotelScope(req) {
  if (req.user.role === "SUPER_ADMIN" && req.query.hotelId) {
    return Number(req.query.hotelId);
  }

  return req.user.hotelId;
}

async function getScopedHotel(req) {
  const hotelId = getHotelScope(req);

  if (!hotelId) {
    throw new ApiError(400, "El usuario no tiene un hotel asignado.");
  }

  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });

  if (!hotel) {
    throw new ApiError(404, "Hotel no encontrado.");
  }

  return hotel;
}

router.get("/summary", async (req, res, next) => {
  try {
    const hotel = await getScopedHotel(req);
    const [rooms, bookings, activeBookings, todayCheckIns] = await Promise.all([
      prisma.room.count({ where: { hotelId: hotel.id, active: true } }),
      prisma.booking.count({ where: { hotelId: hotel.id } }),
      prisma.booking.count({
        where: {
          hotelId: hotel.id,
          status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
        },
      }),
      prisma.booking.count({
        where: {
          hotelId: hotel.id,
          checkIn: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
    ]);

    res.json({
      hotel,
      metrics: {
        rooms,
        bookings,
        activeBookings,
        todayCheckIns,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/hotel", async (req, res, next) => {
  try {
    const hotel = await getScopedHotel(req);
    res.json(hotel);
  } catch (error) {
    next(error);
  }
});

router.put("/hotel", async (req, res, next) => {
  try {
    const hotel = await getScopedHotel(req);
    const payload = hotelSchema.parse(req.body);
    const updated = await prisma.hotel.update({
      where: { id: hotel.id },
      data: payload,
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.get("/rooms", async (req, res, next) => {
  try {
    const hotel = await getScopedHotel(req);
    const rooms = await prisma.room.findMany({
      where: { hotelId: hotel.id },
      orderBy: [{ active: "desc" }, { code: "asc" }],
    });
    res.json(rooms);
  } catch (error) {
    next(error);
  }
});

router.post("/rooms", async (req, res, next) => {
  try {
    const hotel = await getScopedHotel(req);
    const payload = roomSchema.parse(req.body);
    const room = await prisma.room.create({
      data: {
        ...payload,
        hotelId: hotel.id,
      },
    });
    res.status(201).json(room);
  } catch (error) {
    next(error);
  }
});

router.put("/rooms/:id", async (req, res, next) => {
  try {
    const hotel = await getScopedHotel(req);
    const payload = roomSchema.partial().parse(req.body);
    const room = await prisma.room.findFirst({
      where: { id: Number(req.params.id), hotelId: hotel.id },
    });

    if (!room) {
      throw new ApiError(404, "Habitacion no encontrada.");
    }

    const updated = await prisma.room.update({
      where: { id: room.id },
      data: payload,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.get("/bookings", async (req, res, next) => {
  try {
    const hotel = await getScopedHotel(req);
    const bookings = await prisma.booking.findMany({
      where: { hotelId: hotel.id },
      include: {
        room: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

router.put("/bookings/:id/status", async (req, res, next) => {
  try {
    const hotel = await getScopedHotel(req);
    const payload = bookingStatusSchema.parse(req.body);
    const booking = await prisma.booking.findFirst({
      where: { id: Number(req.params.id), hotelId: hotel.id },
    });

    if (!booking) {
      throw new ApiError(404, "Reserva no encontrada.");
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: payload.status,
        managedById: req.user.id,
      },
    });

    if (payload.status === "CHECKED_IN") {
      await prisma.room.update({
        where: { id: booking.roomId },
        data: { status: "OCCUPIED" },
      });
    }

    if (payload.status === "COMPLETED") {
      await prisma.room.update({
        where: { id: booking.roomId },
        data: { status: "CLEANING" },
      });
    }

    if (payload.status === "CANCELLED") {
      await prisma.room.update({
        where: { id: booking.roomId },
        data: { status: "AVAILABLE" },
      });
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
