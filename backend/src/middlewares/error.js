function errorMiddleware(error, req, res, next) {
  const status = error.status || 500;
  const message = error.message || "Error interno del servidor.";

  if (status >= 500) {
    console.error(error);
  }

  res.status(status).json({ message });
}

module.exports = { errorMiddleware };
