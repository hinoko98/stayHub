const express = require("express");
const { prisma } = require("../config/prisma");
const { allowRoles, requireAuth } = require("../middlewares/auth");
const { ApiError } = require("../utils/api-error");

const router = express.Router();

router.use(requireAuth, allowRoles("CUSTOMER"));

router.get("/bookings", async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { customerId: req.user.id },
      include: {
        hotel: true,
        room: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

router.put("/bookings/:id/cancel", async (req, res, next) => {
  try {
    const bookingId = Number(req.params.id);
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        customerId: req.user.id,
      },
    });

    if (!booking) {
      throw new ApiError(404, "Reserva no encontrada.");
    }

    if (["CHECKED_IN", "COMPLETED"].includes(booking.status)) {
      throw new ApiError(400, "No puedes cancelar una reserva ya atendida.");
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED" },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
