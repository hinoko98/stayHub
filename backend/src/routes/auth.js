const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { prisma } = require("../config/prisma");
const { env } = require("../config/env");
const { requireAuth } = require("../middlewares/auth");
const { ApiError } = require("../utils/api-error");

const router = express.Router();

const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function buildUsername(email) {
  return email.split("@")[0].toLowerCase();
}

function serializeUser(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    username: user.username || buildUsername(user.email),
    document: user.document,
    phone: user.phone,
    role: user.role,
    status: user.status,
    hotel: user.hotel
      ? {
          id: user.hotel.id,
          name: user.hotel.name,
          slug: user.hotel.slug,
        }
      : null,
  };
}

async function buildAuthResponse(user) {
  const token = jwt.sign({ userId: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: "7d",
  });

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
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

  return {
    token,
    user: serializeUser(fullUser),
  };
}

router.post("/register", async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);
    const email = payload.email.toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ApiError(409, "Ya existe un usuario con ese correo.");
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await prisma.user.create({
      data: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email,
        username: buildUsername(email),
        phone: payload.phone,
        passwordHash,
        role: "CUSTOMER",
        status: "ACTIVE",
      },
    });

    const authResponse = await buildAuthResponse(user);
    res.status(201).json(authResponse);
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
    });

    if (!user || user.status !== "ACTIVE") {
      throw new ApiError(401, "Credenciales invalidas.");
    }

    const isValidPassword = await bcrypt.compare(payload.password, user.passwordHash);

    if (!isValidPassword) {
      throw new ApiError(401, "Credenciales invalidas.");
    }

    const authResponse = await buildAuthResponse(user);
    res.json(authResponse);
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (req, res) => {
  res.json({ user: serializeUser(req.user) });
});

module.exports = router;
