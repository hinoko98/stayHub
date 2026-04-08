const bcrypt = require("bcryptjs");
const { PrismaClient, UserRole, RoomStatus, BookingOrigin, BookingStatus } = require("@prisma/client");

const prisma = new PrismaClient();

const motelCatalog = [
  {
    name: "Residencias K18 Premium Suites",
    slug: "residencias-k18-premium-suites",
    address: "Carrera 18 #54-47, Bucaramanga, Santander, Colombia",
    neighborhood: "Cabecera",
    rating: 4.5,
    coverImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
  },
  {
    name: "Residencias Aventuras De Amor",
    slug: "residencias-aventuras-de-amor",
    address: "Cl. 54 #18-82, Bucaramanga, Santander, Colombia",
    neighborhood: "Cabecera",
    rating: 4.5,
    coverImage: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80",
  },
  {
    name: "Motel Palmeiras",
    slug: "motel-palmeiras",
    address: "Cra. 33 #70-58, Bucaramanga, Santander, Colombia",
    neighborhood: "Sotomayor",
    rating: 4.4,
    coverImage: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80",
  },
  {
    name: "Motel Venus",
    slug: "motel-venus",
    address: "Cra. 33, Via Antigua Floridablanca-Bucaramanga #67-44, Bucaramanga, Santander, Colombia",
    neighborhood: "Via Antigua",
    rating: 4.3,
    coverImage: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=80",
  },
  {
    name: "Motel Mi Granjita",
    slug: "motel-mi-granjita",
    address: "Cra. 33 #75-74, Sotomayor, Bucaramanga, Santander, Colombia",
    neighborhood: "Sotomayor",
    rating: 4.2,
    coverImage: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80",
  },
  {
    name: "Motel Eclipse",
    slug: "motel-eclipse",
    address: "Via Antigua a Floridablanca, Bucaramanga, Santander, Colombia",
    neighborhood: "Via Antigua",
    rating: 4.0,
    coverImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
  },
  {
    name: "Motel El Paraiso",
    slug: "motel-el-paraiso",
    address: "Bucaramanga, Santander, Colombia",
    neighborhood: "Bucaramanga",
    rating: 5.0,
    coverImage: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&q=80",
  },
  {
    name: "Residencias Atlantis",
    slug: "residencias-atlantis",
    address: "Cra. 18 #54-57, Bucaramanga, Santander, Colombia",
    neighborhood: "Cabecera",
    rating: 4.2,
    coverImage: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80",
  },
  {
    name: "Residencia Mar De Emociones",
    slug: "residencia-mar-de-emociones",
    address: "Cra. 17C #57-40, Bucaramanga, Santander, Colombia",
    neighborhood: "Cabecera",
    rating: 4.4,
    coverImage: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80",
  },
  {
    name: "La Concordia",
    slug: "la-concordia",
    address: "Cra. 18 #51A-38, Bucaramanga, Santander, Colombia",
    neighborhood: "Concordia",
    rating: 4.2,
    coverImage: "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=1200&q=80",
  },
  {
    name: "Motel Cherry Hot",
    slug: "motel-cherry-hot",
    address: "Cl. 57 #17B-43, Bucaramanga, Santander, Colombia",
    neighborhood: "Cabecera",
    rating: 4.6,
    coverImage: "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=1200&q=80",
  },
  {
    name: "Dagaz Suites",
    slug: "dagaz-suites",
    address: "Cl. 35 #32-70, Mejoras Publicas, Bucaramanga, Santander, Colombia",
    neighborhood: "Mejoras Publicas",
    rating: 4.5,
    coverImage: "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=1200&q=80",
  },
  {
    name: "Estadero Motel Los Gansos",
    slug: "estadero-motel-los-gansos",
    address: "Cl. 19 #63-31, Bucaramanga, Santander, Colombia",
    neighborhood: "Occidente",
    rating: 2.8,
    coverImage: "https://images.unsplash.com/photo-1468824357306-a439d58ccb1c?w=1200&q=80",
  },
  {
    name: "Motel Mis Cabañitas",
    slug: "motel-mis-cabanitas",
    address: "Km 3 Via Calle 18A #64-71 Barrio Buenavista, Bucaramanga-Pamplona, Bucaramanga, Santander, Colombia",
    neighborhood: "Buenavista",
    rating: 3.9,
    coverImage: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=1200&q=80",
  },
];

function buildRooms(prefix, basePrice) {
  return [
    {
      code: `${prefix}-STD`,
      number: `${prefix.replace("M", "")}1`,
      reference: "Suite Estandar",
      name: "Suite Estandar",
      type: "Suite",
      floor: 1,
      bedCount: 1,
      bedType: "Cama doble",
      capacity: 2,
      maxCapacity: 2,
      pricePerNight: basePrice,
      basePrice,
      description: "Suite privada con ambientacion discreta para estadias cortas o por noche.",
      amenities: "Jacuzzi,Parqueadero privado,TV Smart,Aire acondicionado",
      status: RoomStatus.AVAILABLE,
      generalStatus: "AVAILABLE",
      cleaningStatus: "CLEAN",
      maintenanceStatus: "NORMAL",
    },
    {
      code: `${prefix}-DLX`,
      number: `${prefix.replace("M", "")}2`,
      reference: "Suite Deluxe",
      name: "Suite Deluxe",
      type: "Deluxe",
      floor: 1,
      bedCount: 1,
      bedType: "Cama king",
      capacity: 2,
      maxCapacity: 2,
      pricePerNight: basePrice + 45000,
      basePrice: basePrice + 45000,
      description: "Suite con mejor ambientacion, luces regulables y acabados superiores.",
      amenities: "Jacuzzi,TV Smart,Aire acondicionado,Iluminacion ambiental,Wifi",
      status: RoomStatus.AVAILABLE,
      generalStatus: "AVAILABLE",
      cleaningStatus: "CLEAN",
      maintenanceStatus: "NORMAL",
    },
  ];
}

async function main() {
  await prisma.payment.deleteMany();
  await prisma.bookingGuest.deleteMany();
  await prisma.guest.deleteMany();
  await prisma.client.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();
  await prisma.hotel.deleteMany();

  const superAdminPassword = await bcrypt.hash("Admin123*", 10);
  const customerPassword = await bcrypt.hash("Cliente123*", 10);
  const staffPassword = await bcrypt.hash("Motel123*", 10);

  await prisma.user.create({
      data: {
        firstName: "Super",
        lastName: "Admin",
        email: "admin@motelcompleto.local",
        username: "admin",
        phone: "3000000000",
        passwordHash: superAdminPassword,
        role: UserRole.SUPER_ADMIN,
    },
  });

  const customer = await prisma.user.create({
      data: {
        firstName: "Carlos",
        lastName: "Mendoza",
        email: "cliente@motelcompleto.local",
        username: "cliente",
        phone: "3101234567",
        passwordHash: customerPassword,
        role: UserRole.CUSTOMER,
    },
  });

  for (let index = 0; index < motelCatalog.length; index += 1) {
    const motelInput = motelCatalog[index];
    const hotel = await prisma.hotel.create({
      data: {
        name: motelInput.name,
        slug: motelInput.slug,
        description:
          `${motelInput.name} es un motel de Bucaramanga orientado a reservas discretas y gestion centralizada desde el panel interno.`,
        city: "Bucaramanga",
        address: motelInput.address,
        neighborhood: motelInput.neighborhood,
        stars: motelInput.rating >= 4.5 ? 4 : 3,
        rating: motelInput.rating,
        coverImage: motelInput.coverImage,
        amenities: "Jacuzzi,Parqueadero privado,Aire acondicionado,TV Smart,Wifi",
      },
    });

    const roomSeed = buildRooms(`M${String(index + 1).padStart(2, "0")}`, 85000 + index * 4000);
    const createdRooms = [];

    for (const roomInput of roomSeed) {
      const room = await prisma.room.create({
        data: {
          ...roomInput,
          hotelId: hotel.id,
        },
      });
      createdRooms.push(room);
    }

    if (index === 0) {
      await prisma.user.create({
        data: {
          firstName: "Laura",
          lastName: "Rios",
          email: "admin.k18@motelcompleto.local",
          username: "admin.k18",
          phone: "3001112233",
          passwordHash: staffPassword,
          role: UserRole.HOTEL_ADMIN,
          hotelId: hotel.id,
        },
      });

      await prisma.user.create({
        data: {
          firstName: "Diego",
          lastName: "Suarez",
          email: "recepcion.k18@motelcompleto.local",
          username: "recepcion.k18",
          phone: "3001119988",
          passwordHash: staffPassword,
          role: UserRole.RECEPTION,
          hotelId: hotel.id,
        },
      });

      const client = await prisma.client.create({
        data: {
          hotelId: hotel.id,
          firstName: "Carlos",
          lastName: "Mendoza",
          documentType: "CC",
          documentNumber: "109800001",
          primaryPhone: "3101234567",
          email: "cliente@motelcompleto.local",
          city: "Bucaramanga",
          country: "Colombia",
        },
      });

      const booking = await prisma.booking.create({
        data: {
          reference: "MC-0001",
          hotelId: hotel.id,
          roomId: createdRooms[0].id,
          customerId: customer.id,
          clientId: client.id,
          createdById: customer.id,
          guestName: "Carlos Mendoza",
          guestEmail: "cliente@motelcompleto.local",
          guestPhone: "3101234567",
          guests: 2,
          adultCount: 2,
          minorCount: 0,
          checkIn: new Date("2026-04-16"),
          checkOut: new Date("2026-04-17"),
          nights: 1,
          pricePerNight: createdRooms[0].pricePerNight,
          subtotal: createdRooms[0].pricePerNight,
          totalPrice: createdRooms[0].pricePerNight,
          advancePaid: 50000,
          pendingBalance: createdRooms[0].pricePerNight - 50000,
          status: BookingStatus.CONFIRMED,
          origin: BookingOrigin.WEB,
          observations: "Ingreso discreto y parqueadero privado.",
          specialRequests: "Ingreso discreto y parqueadero privado.",
        },
      });

      await prisma.payment.create({
        data: {
          hotelId: hotel.id,
          bookingId: booking.id,
          totalReservationAmount: booking.totalPrice,
          amountPaid: 50000,
          pendingBalanceAfter: booking.pendingBalance,
          type: "ADVANCE",
          method: "TRANSFER",
          reference: "ABONO-DEMO-01",
          status: "PARTIAL",
          registeredById: customer.id,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
