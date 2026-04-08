const express = require("express");
const { hotelOf, prisma, paymentDto, ApiError } = require("./internal-common");

const router = express.Router();

async function reservationOf(req, id) {
  const hotel = await hotelOf(req);
  const reservation = await prisma.booking.findFirst({ where: { id, hotelId: hotel.id }, include: { client: true, room: true } });
  if (!reservation) throw new ApiError(404, "Reserva no encontrada.");
  return reservation;
}
async function paymentOf(req, id) {
  const hotel = await hotelOf(req);
  const payment = await prisma.payment.findFirst({ where: { id, hotelId: hotel.id }, include: { booking: { include: { client: true, room: true } }, registeredBy: true } });
  if (!payment) throw new ApiError(404, "Pago no encontrado.");
  return payment;
}
async function recalc(bookingId) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { payments: true } });
  const paid = booking.payments.filter((item) => !["VOID", "REFUNDED"].includes(item.status)).reduce((sum, item) => sum + Number(item.amountPaid), 0);
  await prisma.booking.update({ where: { id: bookingId }, data: { advancePaid: paid, pendingBalance: Math.max(0, Number(booking.totalPrice) - paid) } });
}

router.get("/", async (req, res, next) => {
  try {
    const hotel = await hotelOf(req);
    const items = await prisma.payment.findMany({ where: { hotelId: hotel.id }, orderBy: { paymentDate: "desc" }, include: { booking: { include: { client: true, room: true } }, registeredBy: true } });
    res.json({ items: items.map((item) => paymentDto(item)) });
  } catch (error) { next(error); }
});
router.get("/:id", async (req, res, next) => { try { res.json(paymentDto(await paymentOf(req, Number(req.params.id)))); } catch (error) { next(error); } });
router.post("/", async (req, res, next) => {
  try {
    const hotel = await hotelOf(req);
    const payload = req.body;
    const reservation = await reservationOf(req, Number(payload.reservationId));
    const amountPaid = Number(payload.amountPaid);
    const payment = await prisma.payment.create({ data: { hotelId: hotel.id, bookingId: reservation.id, totalReservationAmount: reservation.totalPrice, amountPaid, pendingBalanceAfter: Math.max(0, Number(reservation.totalPrice) - amountPaid), type: payload.type || "ADVANCE", method: payload.method, reference: payload.reference || null, notes: payload.notes || null, status: payload.status || (Number(reservation.totalPrice) - amountPaid <= 0 ? "PAID" : "PARTIAL"), registeredById: req.user.id }, include: { booking: { include: { client: true, room: true } }, registeredBy: true } });
    await recalc(reservation.id);
    res.status(201).json(paymentDto(payment));
  } catch (error) { next(error); }
});
router.put("/:id", async (req, res, next) => {
  try {
    const current = await paymentOf(req, Number(req.params.id));
    const payload = req.body;
    const reservation = payload.reservationId ? await reservationOf(req, Number(payload.reservationId)) : current.booking;
    const amountPaid = Number(payload.amountPaid ?? current.amountPaid);
    const payment = await prisma.payment.update({ where: { id: current.id }, data: { bookingId: reservation.id, totalReservationAmount: reservation.totalPrice, amountPaid, pendingBalanceAfter: Math.max(0, Number(reservation.totalPrice) - amountPaid), type: payload.type ?? current.type, method: payload.method ?? current.method, reference: payload.reference !== undefined ? payload.reference : current.reference, notes: payload.notes !== undefined ? payload.notes : current.notes, status: payload.status ?? current.status }, include: { booking: { include: { client: true, room: true } }, registeredBy: true } });
    await recalc(payment.bookingId);
    res.json(paymentDto(payment));
  } catch (error) { next(error); }
});
router.delete("/:id", async (req, res, next) => { try { const payment = await paymentOf(req, Number(req.params.id)); await prisma.payment.delete({ where: { id: payment.id } }); await recalc(payment.booking.id); res.json({ message: "Pago eliminado correctamente." }); } catch (error) { next(error); } });

module.exports = router;
