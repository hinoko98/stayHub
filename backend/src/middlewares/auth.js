const jwt = require("jsonwebtoken");
const { prisma } = require("../config/prisma");
const { env } = require("../config/env");

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Debes iniciar sesion." });
    }

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user || user.status === "INACTIVE") {
      return res.status(401).json({ message: "Sesion invalida." });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token invalido o expirado." });
  }
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "No tienes permisos para esta accion." });
    }

    next();
  };
}

module.exports = { requireAuth, allowRoles };
