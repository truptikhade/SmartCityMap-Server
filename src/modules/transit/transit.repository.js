const prisma = require('../../config/prisma')

const findAllRoutes = async (transitType) => {
  const where = { isActive: true }
  if (transitType) where.transitType = transitType

  return prisma.transitRoute.findMany({
    where,
    orderBy: { routeName: 'asc' },
  })
}

const findAllRoutesWithStops = async (date) => {
  const startDate = date
    ? new Date(`${date}T00:00:00.000`)
    : new Date(new Date().setHours(0, 0, 0, 0))

  const endDate = date
    ? new Date(`${date}T23:59:59.999`)
    : new Date(new Date().setHours(23, 59, 59, 999))

  return prisma.transitRoute.findMany({
    where: {
      isActive: true,
      transitType: {
        in: ['bus', 'train'],
      },
    },

    include: {
      stops: {
        orderBy: {
          stopOrder: 'asc',
        },
      },

      trips: {
        where: {
          travelDate: {
            gte: startDate,
            lte: endDate,
          },

          status: {
            in: ['scheduled', 'running'],
          },

          availableSeats: {
            gt: 0,
          },
        },

        orderBy: {
          departureTime: 'asc',
        },

        take: 1,
      },
    },

    orderBy: {
      routeName: 'asc',
    },
  })
}

const findRouteById = async (id) => {
  return prisma.transitRoute.findUnique({ where: { id } })
}

const findStopsByRoute = async (routeId) => {
  return prisma.transitStop.findMany({
    where: { routeId },
    orderBy: { stopOrder: 'asc' },
  })
}

const findNearbyStops = async ({ lat, lng, radius = 1500 }) => {
  return prisma.$queryRaw`
    SELECT
      s.*,
      ROUND(CAST(
        6371000 * acos(
          cos(radians(${lat})) * cos(radians(s.lat)) *
          cos(radians(s.lng) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(s.lat))
        ) AS numeric), 2
      ) AS distance
    FROM transit.transit_stops s
    WHERE (
      6371000 * acos(
        cos(radians(${lat})) * cos(radians(s.lat)) *
        cos(radians(s.lng) - radians(${lng})) +
        sin(radians(${lat})) * sin(radians(s.lat))
      )
    ) <= ${radius}
    ORDER BY distance ASC
    LIMIT 50
  `
}

const findTripsByRoute = async ({ routeId, date }) => {
  return prisma.trip.findMany({
    where: {
      routeId,
      travelDate: new Date(date),
      status: { notIn: ['cancelled'] },
    },
    orderBy: { departureTime: 'asc' },
  })
}

const findTripById = async (id) => {
  return prisma.trip.findUnique({
    where: { id },
    include: { route: true },
  })
}

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
  })
}

const upsertLiveTracking = async ({
  tripId, currentLat, currentLng,
  currentStopId, nextStopId, speedKmph, bearing, delayMinutes,
}) => {
  return prisma.liveTracking.upsert({
    where: { tripId },
    update: {
      currentLat, currentLng, currentStopId, nextStopId,
      speedKmph, bearing, delayMinutes,
    },
    create: {
      tripId, currentLat, currentLng, currentStopId, nextStopId,
      speedKmph, bearing, delayMinutes: delayMinutes || 0,
    },
  })
}

const findRouteWithActiveTrips = async ({
  routeId,
  date,
}) => {
  const startDate = date
    ? new Date(`${date}T00:00:00.000`)
    : new Date(new Date().setHours(0, 0, 0, 0))

  const endDate = date
    ? new Date(`${date}T23:59:59.999`)
    : new Date(new Date().setHours(23, 59, 59, 999))

  return prisma.transitRoute.findUnique({
    where: {
      id: routeId,
    },

    include: {
      stops: {
        orderBy: {
          stopOrder: 'asc',
        },
      },

      trips: {
        where: {
          travelDate: {
            gte: startDate,
            lte: endDate,
          },

          status: {
            in: ['scheduled', 'running'],
          },
        },

        orderBy: {
          departureTime: 'asc',
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
  })
}



module.exports = {
  findAllRoutes,
  findAllRoutesWithStops,
  findRouteById,
  findStopsByRoute,
  findNearbyStops,
  findTripsByRoute,
  findTripById,
  findLiveTracking,
  upsertLiveTracking,
  findRouteWithActiveTrips,
}
