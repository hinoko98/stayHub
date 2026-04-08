const express = require("express");
const { hotelOf, pageOf, prisma, roomDto, roomStatusFromGeneral, ApiError } = require("./internal-common");

const router = express.Router();

async function roomOf(req, id) {
  const hotel = await hotelOf(req);
  const room = await prisma.room.findFirst({ where: { id, hotelId: hotel.id }, include: { bookings: { orderBy: { createdAt: "desc" } } } });
  if (!room) throw new ApiError(404, "Habitacion no encontrada.");
  return room;
}

router.get("/", async (req, res, next) => {
  try {
    const hotel = await hotelOf(req);
    const { page, limit, skip } = pageOf(req.query);
    const where = { hotelId: hotel.id, ...(req.query.search ? { OR: [{ number: { contains: String(req.query.search) } }, { code: { contains: String(req.query.search) } }, { type: { contains: String(req.query.search) } }] } : {}) };
    const [items, total] = await Promise.all([prisma.room.findMany({ where, skip, take: limit, orderBy: [{ floor: "asc" }, { number: "asc" }] }), prisma.room.count({ where })]);
    res.json({ items: items.map((item) => roomDto(item)), meta: { page, limit, total } });
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => { try { res.json(roomDto(await roomOf(req, Number(req.params.id)), true)); } catch (error) { next(error); } });

router.post("/", async (req, res, next) => {
  try {
    const hotel = await hotelOf(req);
    const payload = req.body;
    const generalStatus = payload.generalStatus || "AVAILABLE";
    const basePrice = Number(payload.basePrice ?? payload.pricePerNight ?? 0);
    const room = await prisma.room.create({ data: { hotelId: hotel.id, name: payload.name || payload.reference || payload.type, code: payload.code || payload.number || `H-${String(Date.now()).slice(-6)}`, number: payload.number || payload.code || `H-${String(Date.now()).slice(-6)}`, reference: payload.reference || null, type: payload.type, floor: payload.floor ?? null, bedCount: Number(payload.bedCount ?? 1), bedType: payload.bedType || null, capacity: Number(payload.capacity ?? payload.maxCapacity), maxCapacity: Number(payload.maxCapacity ?? payload.capacity), pricePerNight: Number(payload.pricePerNight ?? basePrice), basePrice, seasonalPrice: payload.seasonalPrice ?? null, description: payload.description || null, amenities: payload.amenities || null, generalStatus, status: payload.status || roomStatusFromGeneral(generalStatus), cleaningStatus: payload.cleaningStatus || "CLEAN", maintenanceStatus: payload.maintenanceStatus || "NORMAL", active: payload.active ?? true } });
    res.status(201).json(roomDto(room));
  } catch (error) { next(error); }
});

router.put("/:id", async (req, res, next) => {
  try {
    const current = await roomOf(req, Number(req.params.id));
    const payload = req.body;
    const generalStatus = payload.generalStatus || current.generalStatus;
    const room = await prisma.room.update({ where: { id: current.id }, data: { name: payload.name ?? current.name, code: payload.code ?? current.code, number: payload.number ?? current.number, reference: payload.reference !== undefined ? payload.reference : current.reference, type: payload.type ?? current.type, floor: payload.floor !== undefined ? payload.floor : current.floor, bedCount: Number(payload.bedCount ?? current.bedCount), bedType: payload.bedType !== undefined ? payload.bedType : current.bedType, capacity: Number(payload.capacity ?? payload.maxCapacity ?? current.capacity), maxCapacity: Number(payload.maxCapacity ?? payload.capacity ?? current.maxCapacity), pricePerNight: Number(payload.pricePerNight ?? payload.basePrice ?? current.pricePerNight), basePrice: Number(payload.basePrice ?? payload.pricePerNight ?? current.basePrice), seasonalPrice: payload.seasonalPrice !== undefined ? payload.seasonalPrice : current.seasonalPrice, description: payload.description !== undefined ? payload.description : current.description, amenities: payload.amenities !== undefined ? payload.amenities : current.amenities, generalStatus, status: payload.status || roomStatusFromGeneral(generalStatus), cleaningStatus: payload.cleaningStatus ?? current.cleaningStatus, maintenanceStatus: payload.maintenanceStatus ?? current.maintenanceStatus, active: payload.active ?? current.active } });
    res.json(roomDto(room));
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => { try { const room = await roomOf(req, Number(req.params.id)); await prisma.room.delete({ where: { id: room.id } }); res.json({ message: "Habitacion eliminada correctamente." }); } catch (error) { next(error); } });

module.exports = router;
