const express = require("express");
const { ACTIVE_BOOKING_STATUSES, hotelOf, prisma, roomNumber } = require("./internal-common");

const router = express.Router();

router.get("/summary", async (req, res, next) => {
  try {
    const hotel = await hotelOf(req);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const [rooms, todayBookings, checkIns, checkOuts, payments, pending, checkedIn, departures, cancelled] = await Promise.all([
      prisma.room.findMany({ where: { hotelId: hotel.id, active: true }, include: { bookings: { where: { status: { in: ACTIVE_BOOKING_STATUSES }, checkOut: { gt: start } }, include: { client: true } } }, orderBy: [{ floor: "asc" }, { number: "asc" }] }),
      prisma.booking.findMany({ where: { hotelId: hotel.id, checkIn: { gte: start, lte: end } }, include: { client: true, room: true }, orderBy: { checkIn: "asc" }, take: 10 }),
      prisma.booking.count({ where: { hotelId: hotel.id, actualCheckInAt: { gte: start, lte: end } } }),
      prisma.booking.count({ where: { hotelId: hotel.id, actualCheckOutAt: { gte: start, lte: end } } }),
      prisma.payment.findMany({ where: { hotelId: hotel.id, paymentDate: { gte: start, lte: end }, status: { notIn: ["VOID", "REFUNDED"] } } }),
      prisma.booking.count({ where: { hotelId: hotel.id, pendingBalance: { gt: 0 } } }),
      prisma.booking.findMany({ where: { hotelId: hotel.id, status: "CHECKED_IN" } }),
      prisma.booking.findMany({ where: { hotelId: hotel.id, status: "CHECKED_IN" }, include: { client: true, room: true }, orderBy: { checkOut: "asc" }, take: 5 }),
      prisma.booking.count({ where: { hotelId: hotel.id, status: "CANCELLED", updatedAt: { gte: start, lte: end } } }),
    ]);

    const floorMap = new Map();
    for (const room of rooms) {
      const floor = room.floor || 0;
      const reservation = [...room.bookings].sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())[0] || null;
      const operationalStatus = room.generalStatus === "CLEANING" ? "CLEANING" : room.generalStatus === "OUT_OF_SERVICE" ? "OUT_OF_SERVICE" : room.maintenanceStatus === "BLOCKED" || room.generalStatus === "MAINTENANCE" ? "MAINTENANCE" : reservation && reservation.status === "CHECKED_IN" ? "OCCUPIED" : reservation && ["PENDING", "CONFIRMED"].includes(reservation.status) ? "RESERVED" : "AVAILABLE";
      const list = floorMap.get(floor) || [];
      list.push({ id: room.id, number: roomNumber(room), floor: room.floor, type: room.type, bedCount: room.bedCount, bedType: room.bedType, maxCapacity: room.maxCapacity, basePrice: room.basePrice, seasonalPrice: room.seasonalPrice, operationalStatus, reservation: reservation ? { id: reservation.id, code: reservation.reference, status: reservation.status, checkInDate: reservation.checkIn, checkOutDate: reservation.checkOut, totalGuests: reservation.guests, client: reservation.client ? { firstName: reservation.client.firstName, lastName: reservation.client.lastName } : null } : null });
      floorMap.set(floor, list);
    }

    const floors = [...floorMap.entries()].map(([floor, items]) => {
      const totals = items.reduce((acc, item) => {
        acc.total += 1;
        if (item.operationalStatus === "AVAILABLE") acc.available += 1;
        if (item.operationalStatus === "RESERVED") acc.reserved += 1;
        if (item.operationalStatus === "OCCUPIED") acc.occupied += 1;
        if (item.operationalStatus === "CLEANING") acc.cleaning += 1;
        if (["MAINTENANCE", "OUT_OF_SERVICE"].includes(item.operationalStatus)) acc.maintenance += 1;
        return acc;
      }, { total: 0, available: 0, reserved: 0, occupied: 0, cleaning: 0, maintenance: 0 });
      return { floor, label: floor > 0 ? `Piso ${floor}` : "Sin piso", totals, rooms: items };
    });

    const totals = floors.reduce((acc, floor) => {
      acc.total += floor.totals.total; acc.available += floor.totals.available; acc.reserved += floor.totals.reserved; acc.occupied += floor.totals.occupied; acc.cleaning += floor.totals.cleaning; acc.maintenance += floor.totals.maintenance; return acc;
    }, { total: 0, available: 0, reserved: 0, occupied: 0, cleaning: 0, maintenance: 0 });

    res.json({
      cards: { availableRooms: totals.available, reservedRooms: totals.reserved, occupiedRooms: totals.occupied, cleaningRooms: totals.cleaning, maintenanceRooms: totals.maintenance, reservationsToday: todayBookings.length, checkInsToday: checkIns, checkOutsToday: checkOuts, todayIncome: payments.reduce((sum, item) => sum + Number(item.amountPaid), 0), pendingPayments: pending, currentOccupation: totals.total ? Number(((totals.occupied / totals.total) * 100).toFixed(2)) : 0, currentGuests: checkedIn.reduce((sum, item) => sum + item.guests, 0), cancelledReservations: cancelled },
      hotelBoard: { totalRooms: totals.total, totalFloors: floors.length, floors },
      reservationsToday: todayBookings.map((item) => ({ id: item.id, code: item.reference, status: item.status, checkInDate: item.checkIn, checkOutDate: item.checkOut, totalGuests: item.guests, client: item.client ? { firstName: item.client.firstName, lastName: item.client.lastName } : null, room: { number: roomNumber(item.room) } })),
      upcomingDepartures: departures.map((item) => ({ id: item.id, code: item.reference, checkOutDate: item.checkOut, client: item.client ? { firstName: item.client.firstName, lastName: item.client.lastName } : { firstName: "Sin", lastName: "cliente" }, room: { number: roomNumber(item.room) } })),
    });
  } catch (error) { next(error); }
});

module.exports = router;
