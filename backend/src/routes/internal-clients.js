const express = require("express");
const { hotelOf, pageOf, prisma, clientDto, ApiError } = require("./internal-common");

const router = express.Router();

async function clientOf(req, id) {
  const hotel = await hotelOf(req);
  const client = await prisma.client.findFirst({ where: { id, hotelId: hotel.id } });
  if (!client) throw new ApiError(404, "Cliente no encontrado.");
  return client;
}

router.get("/", async (req, res, next) => {
  try {
    const hotel = await hotelOf(req);
    const { page, limit, skip } = pageOf(req.query);
    const where = { hotelId: hotel.id, ...(req.query.search ? { OR: [{ firstName: { contains: String(req.query.search) } }, { lastName: { contains: String(req.query.search) } }, { documentNumber: { contains: String(req.query.search) } }, { email: { contains: String(req.query.search) } }] } : {}) };
    const [items, total] = await Promise.all([prisma.client.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }), prisma.client.count({ where })]);
    res.json({ items: items.map((item) => clientDto(item)), meta: { page, limit, total } });
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => { try { res.json(clientDto(await clientOf(req, Number(req.params.id)))); } catch (error) { next(error); } });
router.post("/", async (req, res, next) => {
  try {
    const hotel = await hotelOf(req);
    const payload = req.body;
    const client = await prisma.client.create({ data: { hotelId: hotel.id, firstName: payload.firstName, lastName: payload.lastName, documentType: payload.documentType || "CC", documentNumber: payload.documentNumber || null, primaryPhone: payload.primaryPhone, email: payload.email || null, city: payload.city || null, country: payload.country || null, notes: payload.notes || null, status: payload.status || "ACTIVE" } });
    res.status(201).json(clientDto(client));
  } catch (error) { next(error); }
});
router.put("/:id", async (req, res, next) => {
  try {
    const current = await clientOf(req, Number(req.params.id));
    const payload = req.body;
    const client = await prisma.client.update({ where: { id: current.id }, data: { firstName: payload.firstName ?? current.firstName, lastName: payload.lastName ?? current.lastName, documentType: payload.documentType ?? current.documentType, documentNumber: payload.documentNumber !== undefined ? payload.documentNumber : current.documentNumber, primaryPhone: payload.primaryPhone ?? current.primaryPhone, email: payload.email !== undefined ? payload.email : current.email, city: payload.city !== undefined ? payload.city : current.city, country: payload.country !== undefined ? payload.country : current.country, notes: payload.notes !== undefined ? payload.notes : current.notes, status: payload.status ?? current.status } });
    res.json(clientDto(client));
  } catch (error) { next(error); }
});
router.delete("/:id", async (req, res, next) => { try { const client = await clientOf(req, Number(req.params.id)); await prisma.client.delete({ where: { id: client.id } }); res.json({ message: "Cliente eliminado correctamente." }); } catch (error) { next(error); } });

module.exports = router;
