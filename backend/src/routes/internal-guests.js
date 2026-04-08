const express = require("express");
const { hotelOf, prisma, guestDto } = require("./internal-common");

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const hotel = await hotelOf(req);
    const payload = req.body;
    const guest = await prisma.guest.create({ data: { hotelId: hotel.id, firstName: payload.firstName, lastName: payload.lastName, documentType: payload.documentType || null, documentNumber: payload.documentNumber || null, relationToClient: payload.relationToClient || null, phone: payload.phone || null, isMinor: Boolean(payload.isMinor) } });
    res.status(201).json(guestDto(guest));
  } catch (error) { next(error); }
});

module.exports = router;
