import prisma from "../../config/prisma.js";

const findAllRoutes = async (transitType) => {
  const where = { isActive: true };
  if (transitType) where.transitType = transitType;

  return prisma.transitRoute.findMany({
    where,
    orderBy: { routeName: "asc" },
  });
};

const findAllRoutesWithStops = async (date) => {
  const startDate = date
    ? new Date(`${date}T00:00:00.000`)
    : new Date(new Date().setHours(0, 0, 0, 0));

  const endDate = date
    ? new Date(`${date}T23:59:59.999`)
    : new Date(new Date().setHours(23, 59, 59, 999));

  return prisma.transitRoute.findMany({
    where: {
      isActive: true,
      transitType: {
        in: ["bus", "train"],
      },
    },

    include: {
      stops: {
        orderBy: {
          stopOrder: "asc",
        },
      },

      trips: {
        where: {
          travelDate: {
            gte: startDate,
            lte: endDate,
          },

          status: {
            in: ["scheduled", "running"],
          },

        },

        orderBy: {
          departureTime: "asc",
        },

        take: 1,
        include: {
          bookings: {
            where: { status: { not: "cancelled" } },
            select: { seatNumber: true },
          },
        },
      },
    },

    orderBy: {
      routeName: "asc",
    },
  });
};

const findRouteById = async (id) => {
  return prisma.transitRoute.findUnique({ where: { id } });
};

const findStopsByRoute = async (routeId) => {
  return prisma.transitStop.findMany({
    where: { routeId },
    orderBy: { stopOrder: "asc" },
  });
};

const findNearbyStops = async ({ lat, lng, radius = 1500 }) => {
  return prisma.$queryRaw`
    SELECT
      s.id,
      s.route_id AS "routeId",
      s.stop_name AS "stopName",
      s.stop_code AS "stopCode",
      s.stop_order AS "stopOrder",
      s.lat,
      s.lng,
      s.arrival_time AS "arrivalTime",
      s.departure_time AS "departureTime",
      s.distance_from_prev_km AS "distanceFromPrevKm",
      ROUND(
        ST_Distance(
          s.location,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        )::numeric,
        2
      )::double precision AS distance
    FROM transit.transit_stops s
    WHERE ST_DWithin(
      s.location,
      ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
      ${radius}
    )
    ORDER BY distance ASC
    LIMIT 50
  `;
};

const findTripsByRoute = async ({ routeId, date }) => {
  const startDate = new Date(`${date}T00:00:00`);
  const endDate = new Date(`${date}T23:59:59.999`);

  return prisma.trip.findMany({
    where: {
      routeId,
      travelDate: { gte: startDate, lte: endDate },
      status: "scheduled",
    },
    orderBy: { departureTime: "asc" },
    include: {
      bookings: {
        where: { status: { not: "cancelled" } },
        select: { seatNumber: true },
      },
    },
  });
};

const findTripById = async (id) => {
  return prisma.trip.findUnique({
    where: { id },
    include: { route: true },
  });
};

const findLiveTracking = async (tripId) => {
  return prisma.liveTracking.findUnique({
    where: { tripId },

    include: {
      currentStop: true,
      nextStop: true,

      trip: {
        include: {
          route: true,
        },
      },
    },
  });
};

const upsertLiveTracking = async ({
  tripId,
  currentLat,
  currentLng,
  currentStopId,
  nextStopId,
  speedKmph,
  bearing,
  delayMinutes,
}) => {
  return prisma.liveTracking.upsert({
    where: { tripId },
    update: {
      currentLat,
      currentLng,
      currentStopId,
      nextStopId,
      speedKmph,
      bearing,
      delayMinutes,
    },
    create: {
      tripId,
      currentLat,
      currentLng,
      currentStopId,
      nextStopId,
      speedKmph,
      bearing,
      delayMinutes: delayMinutes || 0,
    },
  });
};

const updateTripStatus = async (tripId, status) =>
  prisma.trip.update({
    where: { id: tripId },
    data: { status },
  });

const findRouteWithActiveTrips = async ({ routeId, date }) => {
  const startDate = date
    ? new Date(`${date}T00:00:00.000`)
    : new Date(new Date().setHours(0, 0, 0, 0));

  const endDate = date
    ? new Date(`${date}T23:59:59.999`)
    : new Date(new Date().setHours(23, 59, 59, 999));

  return prisma.transitRoute.findUnique({
    where: {
      id: routeId,
    },

    include: {
      stops: {
        orderBy: {
          stopOrder: "asc",
        },
      },

      trips: {
        where: {
          travelDate: {
            gte: startDate,
            lte: endDate,
          },

          status: {
            in: ["scheduled", "running"],
          },
        },

        orderBy: {
          departureTime: "asc",
        },

        include: {
          liveTracking: {
            include: {
              currentStop: true,
              nextStop: true,
            },
          },
        },
      },
    },
  });
};

export default {
  findAllRoutes,
  findAllRoutesWithStops,
  findRouteById,
  findStopsByRoute,
  findNearbyStops,
  findTripsByRoute,
  findTripById,
  findLiveTracking,
  upsertLiveTracking,
  updateTripStatus,
  findRouteWithActiveTrips,
};
