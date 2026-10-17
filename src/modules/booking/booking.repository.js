import prisma from "../../config/prisma.js";
import AppError from "../../utils/AppError.js";

const createBooking = async (request) => {
  const {
    userId,
    routeId,
    tripId,
    boardingStopId,
    dropStopId,
    transitType,
    seatNumber,
    farePaid,
    travelDate,
    idempotencyKey,
  } = request;

  try {
    return await prisma.$transaction(async (tx) => {
      if (idempotencyKey) {
        const existing = await tx.booking.findUnique({
          where: { idempotencyKey },
          include: bookingInclude,
        });

        if (existing) {
          if (!matchesBookingRequest(existing, request)) {
            throw new AppError(
              "Idempotency key was already used for a different booking",
              409,
            );
          }

          return existing;
        }
      }

      const normalizedTransitType = String(transitType).toLowerCase();
      const normalizedTravelDate = new Date(`${travelDate}T00:00:00`);

      if (normalizedTransitType === "train") {
        const lockedTrips = await tx.$queryRaw`
        SELECT id
        FROM transit.trips
        WHERE id = ${tripId}
        FOR UPDATE
      `;

        if (lockedTrips.length === 0) {
          throw new AppError("Scheduled train trip not found", 404);
        }

        const trip = await tx.trip.findUnique({
          where: { id: tripId },
          include: { route: true },
        });

        if (
          !trip ||
          trip.routeId !== routeId ||
          String(trip.route.transitType).toLowerCase() !== "train"
        ) {
          throw new AppError(
            "Selected trip does not belong to this train route",
            400,
          );
        }

        const travelDayStart = new Date(`${travelDate}T00:00:00`);
        const travelDayEnd = new Date(`${travelDate}T23:59:59.999`);
        if (
          trip.travelDate < travelDayStart ||
          trip.travelDate > travelDayEnd ||
          trip.status !== "scheduled" ||
          travelDayStart < new Date(new Date().setHours(0, 0, 0, 0))
        ) {
          throw new AppError(
            "Selected train does not run on this travel date",
            409,
          );
        }

        const seat = String(seatNumber || "").trim();
        if (
          !/^\d+$/.test(seat) ||
          Number(seat) < 1 ||
          Number(seat) > trip.totalSeats
        ) {
          throw new AppError(
            `Choose a seat between 1 and ${trip.totalSeats}`,
            400,
          );
        }

        const [boardingStop, dropStop] = await Promise.all([
          tx.transitStop.findFirst({
            where: { id: boardingStopId, routeId },
            select: { stopOrder: true },
          }),
          tx.transitStop.findFirst({
            where: { id: dropStopId, routeId },
            select: { stopOrder: true },
          }),
        ]);

        if (
          !boardingStop ||
          !dropStop ||
          boardingStop.stopOrder >= dropStop.stopOrder
        ) {
          throw new AppError("Choose valid boarding and drop stops", 400);
        }

        const occupiedCount = await tx.booking.count({
          where: {
            tripId,
            status: { not: "cancelled" },
          },
        });
        if (occupiedCount >= trip.totalSeats) {
          throw new AppError("No seats are available on this train", 409);
        }

        const seatAlreadyTaken = await tx.booking.findFirst({
          where: {
            tripId,
            seatNumber: seat,
            status: { not: "cancelled" },
          },
          select: { id: true },
        });
        if (seatAlreadyTaken) {
          throw new AppError(
            "That seat has just been booked. Choose another seat.",
            409,
          );
        }
      }

      return tx.booking.create({
        data: {
          userId,
          routeId,
          tripId,
          boardingStopId,
          dropStopId,
          transitType: normalizedTransitType,
          seatNumber:
            normalizedTransitType === "train"
              ? String(seatNumber).trim()
              : seatNumber,
          farePaid,
          travelDate: normalizedTravelDate,
          status: "pending",
          idempotencyKey: idempotencyKey || null,
        },
        include: bookingInclude,
      });
    });
  } catch (error) {
    if (error.code !== "P2002") throw error;

    const existing = idempotencyKey
      ? await prisma.booking.findUnique({
          where: { idempotencyKey },
          include: bookingInclude,
        })
      : null;

    if (existing) {
      if (matchesBookingRequest(existing, request)) return existing;
      throw new AppError(
        "Idempotency key was already used for a different booking",
        409,
      );
    }

    if (String(transitType).toLowerCase() === "train") {
      throw new AppError(
        "That seat has just been booked. Choose another seat.",
        409,
      );
    }

    throw error;
  }
};

const bookingInclude = {
  route: true,
  trip: true,
  boardingStop: true,
  dropStop: true,
};

const matchesBookingRequest = (booking, request) =>
  booking.userId === request.userId &&
  booking.routeId === request.routeId &&
  booking.tripId === request.tripId &&
  booking.boardingStopId === request.boardingStopId &&
  booking.dropStopId === request.dropStopId &&
  booking.transitType === String(request.transitType).toLowerCase() &&
  booking.seatNumber === (request.seatNumber ? String(request.seatNumber).trim() : null) &&
  Number(booking.farePaid) === Number(request.farePaid) &&
  booking.travelDate.getTime() ===
    new Date(`${request.travelDate}T00:00:00`).getTime();

const findMyBookings = async (userId) => {
  return prisma.booking.findMany({
    where: {
      userId,
    },

    include: {
      route: true,
      trip: true,
      boardingStop: true,
      dropStop: true,
      payment: true,
    },

    orderBy: {
      bookedAt: "desc",
    },

    take: 10,
  });
};

const findBookingById = async (id) => {
  return prisma.booking.findUnique({
    where: {
      id,
    },
    include: {
      route: true,
      trip: true,
      boardingStop: true,
      dropStop: true,
      payment: true,
    },
  });
};

const updateBookingStatus = async (id, status) => {
  return prisma.booking.update({
    where: {
      id,
    },
    data: {
      status,
    },
  });
};

const isSeatTaken = async ({ tripId, seatNumber, travelDate }) => {
  const booking = await prisma.booking.findFirst({
    where: {
      tripId,
      seatNumber,
      travelDate: new Date(travelDate),
      status: {
        notIn: ["cancelled"],
      },
    },
  });

  return !!booking;
};

const findTrainSeatInventory = async (tripId) => {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT id
      FROM transit.trips
      WHERE id = ${tripId}
      FOR UPDATE
    `;

    const trip = await tx.trip.findFirst({
      where: {
        id: tripId,
        route: { transitType: "train" },
        status: "scheduled",
      },
      select: {
        id: true,
        totalSeats: true,
        bookings: {
          where: { status: { not: "cancelled" } },
          select: { seatNumber: true },
        },
      },
    });

    if (!trip) return null;

    return {
      tripId: trip.id,
      totalSeats: trip.totalSeats,
      availableSeats: Math.max(0, trip.totalSeats - trip.bookings.length),
      unavailableSeats: trip.bookings
        .map((booking) => booking.seatNumber)
        .filter(Boolean),
    };
  });
};

const findBookingByIdempotencyKey = async (idempotencyKey) =>
  prisma.booking.findUnique({
    where: { idempotencyKey },
    include: bookingInclude,
  });

export default {
  createBooking,
  findMyBookings,
  findBookingById,
  updateBookingStatus,
  isSeatTaken,
  findTrainSeatInventory,
  findBookingByIdempotencyKey,
};
