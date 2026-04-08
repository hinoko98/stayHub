const express = require("express");
const bcrypt = require("bcryptjs");
const { hotelOf, pageOf, prisma, userDto, ensureAdmin, ApiError, usernameOf } = require("./internal-common");

const router = express.Router();

async function userOf(req, id) {
  const hotel = await hotelOf(req);
  const user = await prisma.user.findFirst({ where: { id, hotelId: hotel.id } });
  if (!user) throw new ApiError(404, "Usuario no encontrado.");
  return user;
}

router.get("/", async (req, res, next) => {
  try {
    const hotel = await hotelOf(req);
    const { page, limit, skip } = pageOf(req.query);
    const where = { hotelId: hotel.id, role: { not: "CUSTOMER" }, ...(req.query.search ? { OR: [{ firstName: { contains: String(req.query.search) } }, { lastName: { contains: String(req.query.search) } }, { document: { contains: String(req.query.search) } }, { username: { contains: String(req.query.search) } }] } : {}) };
    const [items, total] = await Promise.all([prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }), prisma.user.count({ where })]);
    res.json({ items: items.map((item) => userDto(item)), meta: { page, limit, total } });
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    ensureAdmin(req);
    const hotel = await hotelOf(req);
    const payload = req.body;
    if (!payload.email || !payload.password) throw new ApiError(400, "Correo y contrasena son obligatorios.");
    const email = String(payload.email).toLowerCase();
    if (await prisma.user.findUnique({ where: { email } })) throw new ApiError(409, "Ya existe un usuario con ese correo.");
    const passwordHash = await bcrypt.hash(String(payload.password), 10);
    const user = await prisma.user.create({ data: { hotelId: hotel.id, firstName: payload.firstName, lastName: payload.lastName, document: payload.document || null, phone: payload.phone || null, email, username: payload.username || usernameOf(email), passwordHash, role: payload.role || "HOTEL_STAFF", status: payload.status || "ACTIVE" } });
    res.status(201).json(userDto(user));
  } catch (error) { next(error); }
});

router.put("/:id", async (req, res, next) => {
  try {
    ensureAdmin(req);
    const current = await userOf(req, Number(req.params.id));
    const payload = req.body;
    const data = { firstName: payload.firstName ?? current.firstName, lastName: payload.lastName ?? current.lastName, document: payload.document !== undefined ? payload.document : current.document, phone: payload.phone !== undefined ? payload.phone : current.phone, email: payload.email ? String(payload.email).toLowerCase() : current.email, username: payload.username !== undefined ? payload.username : current.username, role: payload.role ?? current.role, status: payload.status ?? current.status };
    if (payload.password) data.passwordHash = await bcrypt.hash(String(payload.password), 10);
    res.json(userDto(await prisma.user.update({ where: { id: current.id }, data })));
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => { try { ensureAdmin(req); const user = await userOf(req, Number(req.params.id)); await prisma.user.delete({ where: { id: user.id } }); res.json({ message: "Usuario eliminado correctamente." }); } catch (error) { next(error); } });

module.exports = router;
