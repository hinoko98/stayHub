const express = require("express");
const cors = require("cors");
const { env } = require("./config/env");
const authRoutes = require("./routes/auth");
const publicRoutes = require("./routes/public");
const meRoutes = require("./routes/me");
const managementRoutes = require("./routes/management");
const { requireAuth, allowRoles } = require("./middlewares/auth");
const internalDashboardRoutes = require("./routes/internal-dashboard");
const internalRoomsRoutes = require("./routes/internal-rooms");
const internalClientsRoutes = require("./routes/internal-clients");
const internalUsersRoutes = require("./routes/internal-users");
const internalGuestsRoutes = require("./routes/internal-guests");
const internalReservationsRoutes = require("./routes/internal-reservations");
const internalPaymentsRoutes = require("./routes/internal-payments");
const { errorMiddleware } = require("./middlewares/error");

const app = express();
const internalAccess = [requireAuth, allowRoles("HOTEL_ADMIN", "HOTEL_STAFF", "SUPER_ADMIN", "RECEPTION", "CASHIER", "HOUSEKEEPING")];

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "hotel-completo-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/me", meRoutes);
app.use("/api/management", managementRoutes);
app.use("/api/internal/dashboard", ...internalAccess, internalDashboardRoutes);
app.use("/api/internal/rooms", ...internalAccess, internalRoomsRoutes);
app.use("/api/internal/clients", ...internalAccess, internalClientsRoutes);
app.use("/api/internal/users", ...internalAccess, internalUsersRoutes);
app.use("/api/internal/guests", ...internalAccess, internalGuestsRoutes);
app.use("/api/internal/reservations", ...internalAccess, internalReservationsRoutes);
app.use("/api/internal/payments", ...internalAccess, internalPaymentsRoutes);

app.use(errorMiddleware);

module.exports = { app };
