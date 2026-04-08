const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const env = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || "hotel-completo-local-secret",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
};

module.exports = { env };
