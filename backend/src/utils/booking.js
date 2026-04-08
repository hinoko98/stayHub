const { ApiError } = require("./api-error");

function normalizeDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, "Fecha invalida.");
  }

  return date;
}

function calculateNights(checkIn, checkOut) {
  const diffMs = checkOut.getTime() - checkIn.getTime();
  const nights = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (nights <= 0) {
    throw new ApiError(400, "La fecha de salida debe ser posterior al check-in.");
  }

  return nights;
}

function buildBookingReference() {
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `HC-${Date.now().toString().slice(-6)}-${random}`;
}

module.exports = {
  normalizeDate,
  calculateNights,
  buildBookingReference,
};
