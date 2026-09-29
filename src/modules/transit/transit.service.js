const AppError = require('../../utils/AppError')
const repo = require('./transit.repository')

const {
  routeModel,
  stopModel,
  tripModel,
  liveModel,
} = require('./transit.model')

/*
 * --------------------------------------------------
 * DISTANCE
 * --------------------------------------------------
 */

const haversineKm = (
  lat1,
  lng1,
  lat2,
  lng2
) => {
  const toRad = (value) =>
    (value * Math.PI) / 180

  const dLat = toRad(
    lat2 - lat1
  )

  const dLng = toRad(
    lng2 - lng1
  )

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2

  return (
    6371 *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  )
}

/*
 * --------------------------------------------------
 * TIME HELPERS
 * --------------------------------------------------
 */

/*
 * Converts:
 *
 * "08:30"
 * "08:30:00"
 * Date
 *
 * into minutes from midnight.
 */
const timeToMinutes = (value) => {
  if (value == null) {
    return null
  }

  /*
   * Handle Date objects.
   */
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null
    }

    return (
      value.getHours() * 60 +
      value.getMinutes()
    )
  }

  const stringValue = String(
    value
  ).trim()

  if (!stringValue) {
    return null
  }

  /*
   * Handle HH:mm or HH:mm:ss.
   */
  const match =
    stringValue.match(
      /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/
    )

  if (match) {
    const hours =
      Number(match[1])

    const minutes =
      Number(match[2])

    if (
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null
    }

    return (
      hours * 60 +
      minutes
    )
  }

  /*
   * Handle ISO/date strings if Prisma
   * returns a Date-like value.
   */
  const parsedDate =
    new Date(stringValue)

  if (
    !Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return (
      parsedDate.getHours() * 60 +
      parsedDate.getMinutes()
    )
  }

  return null
}

/*
 * Calculate duration from actual
 * scheduled departure and arrival.
 *
 * Example:
 *
 * 08:30 → 10:00 = 90 min
 *
 * Also supports:
 *
 * 23:50 → 00:20 = 30 min
 */
const calculateScheduledDuration = (
  departureTime,
  arrivalTime
) => {
  const departure =
    timeToMinutes(
      departureTime
    )

  const arrival =
    timeToMinutes(
      arrivalTime
    )

  if (
    departure == null ||
    arrival == null
  ) {
    return null
  }

  let duration =
    arrival - departure

  /*
   * Arrival is after midnight.
   */
  if (duration < 0) {
    duration += 24 * 60
  }

  /*
   * Reject impossible values.
   */
  if (
    duration <= 0 ||
    duration > 24 * 60
  ) {
    return null
  }

  return duration
}

/*
 * Return a clean HH:mm value for the
 * frontend.
 */
const formatTime = (value) => {
  if (value == null) {
    return null
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null
    }

    return [
      String(
        value.getHours()
      ).padStart(2, '0'),

      String(
        value.getMinutes()
      ).padStart(2, '0'),
    ].join(':')
  }

  const stringValue = String(
    value
  ).trim()

  if (!stringValue) {
    return null
  }

  const match =
    stringValue.match(
      /^(\d{1,2}):(\d{2})/
    )

  if (match) {
    return [
      String(
        Number(match[1])
      ).padStart(2, '0'),

      match[2],
    ].join(':')
  }

  const parsedDate =
    new Date(stringValue)

  if (
    !Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return [
      String(
        parsedDate.getHours()
      ).padStart(2, '0'),

      String(
        parsedDate.getMinutes()
      ).padStart(2, '0'),
    ].join(':')
  }

  return stringValue
}

/*
 * --------------------------------------------------
 * ROUTES
 * --------------------------------------------------
 */

const getAllRoutes = async (
  transitType
) => {
  const routes =
    await repo.findAllRoutes(
      transitType
    )

  return routes.map(
    routeModel
  )
}

const getRouteById = async (
  id
) => {
  const route =
    await repo.findRouteById(
      id
    )

  if (!route) {
    throw new AppError(
      'Route not found',
      404
    )
  }

  return routeModel(
    route
  )
}

/*
 * --------------------------------------------------
 * STOPS
 * --------------------------------------------------
 */

const getStopsByRoute = async (
  routeId
) => {
  const route =
    await repo.findRouteById(
      routeId
    )

  if (!route) {
    throw new AppError(
      'Route not found',
      404
    )
  }

  const stops =
    await repo.findStopsByRoute(
      routeId
    )

  return stops.map(
    stopModel
  )
}

const getNearbyStops = async ({
  lat,
  lng,
  radius,
}) => {
  if (
    lat == null ||
    lng == null
  ) {
    throw new AppError(
      'Latitude and longitude required',
      400
    )
  }

  const stops =
    await repo.findNearbyStops({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius: radius
        ? parseInt(radius)
        : 1500,
    })

  return stops.map(
    stopModel
  )
}

/*
 * --------------------------------------------------
 * TRIPS
 * --------------------------------------------------
 */

const getTripsByRoute = async ({
  routeId,
  date,
}) => {
  if (!date) {
    throw new AppError(
      'Travel date is required',
      400
    )
  }

  const route =
    await repo.findRouteById(
      routeId
    )

  if (!route) {
    throw new AppError(
      'Route not found',
      404
    )
  }

  const trips =
    await repo.findTripsByRoute({
      routeId,
      date,
    })

  return trips.map(
    tripModel
  )
}

/*
 * --------------------------------------------------
 * LIVE TRACKING
 * --------------------------------------------------
 */

const getLiveTracking = async (
  tripId
) => {
  const live =
    await repo.findLiveTracking(
      tripId
    )

  if (!live) {
    throw new AppError(
      'Live tracking not available for this trip',
      404
    )
  }

  return liveModel(
    live
  )
}

/*
 * --------------------------------------------------
 * FARE
 * --------------------------------------------------
 */

const FARE_RULES = {
  bus: {
    base: 10,
    perKm: 2.0,
  },

  train: {
    base: 15,
    perKm: 1.5,
  },

  auto: {
    base: 30,
    perKm: 14.0,
  },
}

const estimateFare = async ({
  routeId,
  distanceKm,
}) => {
  const route =
    await repo.findRouteById(
      routeId
    )

  if (!route) {
    throw new AppError(
      'Route not found',
      404
    )
  }

  if (
    !Number.isFinite(
      distanceKm
    ) ||
    distanceKm <= 0
  ) {
    throw new AppError(
      'Valid distance required',
      400
    )
  }

  const type =
    String(
      route.transitType || ''
    ).toLowerCase()

  const rule =
    FARE_RULES[type] || {
      base:
        Number(
          route.baseFare
        ) || 0,

      perKm: 0,
    }

  const estimatedFare =
    Math.max(
      Number(
        route.baseFare
      ) || 0,

      rule.base +
        distanceKm *
          rule.perKm
    )

  return {
    routeId,

    transitType:
      route.transitType,

    distanceKm:
      Number(
        distanceKm.toFixed(2)
      ),

    baseFare:
      Number(
        rule.base.toFixed(2)
      ),

    perKmRate:
      Number(
        rule.perKm.toFixed(2)
      ),

    estimatedFare:
      Number(
        estimatedFare.toFixed(2)
      ),
  }
}

/*
 * --------------------------------------------------
 * JOURNEY SEARCH
 * --------------------------------------------------
 */

const journeySearch = async ({
  fromLat,
  fromLng,
  toLat,
  toLng,
  date,
}) => {
  const coords = [
    fromLat,
    fromLng,
    toLat,
    toLng,
  ].map(Number)

  if (
    coords.some(
      (value) =>
        !Number.isFinite(
          value
        )
    )
  ) {
    throw new AppError(
      'Valid origin and destination coordinates are required',
      400
    )
  }

  const [
    lat1,
    lng1,
    lat2,
    lng2,
  ] = coords

  const directDistanceKm =
    haversineKm(
      lat1,
      lng1,
      lat2,
      lng2
    )

  const routes =
    await repo.findAllRoutesWithStops(
      date
    )

  const candidates = []

  /*
   * Stop matching radius.
   *
   * Bus:
   * User can start/end within a
   * reasonable distance of a bus stop.
   *
   * Train:
   * Much stricter because trains
   * must use actual railway stations.
   */
  const STOP_MATCH_RADIUS_KM = {
    bus: 12,
    train: 3,
  }

  /*
   * Check every route.
   */
  for (const route of routes) {
    if (
      !route.stops ||
      route.stops.length < 2
    ) {
      continue
    }

    const type =
      String(
        route.transitType || ''
      ).toLowerCase()

    /*
     * Only public transit types
     * supported by journey search.
     */
    if (
      !STOP_MATCH_RADIUS_KM[
        type
      ]
    ) {
      continue
    }

    const maxStopDistance =
      STOP_MATCH_RADIUS_KM[
        type
      ]

    /*
     * Find the best valid pair of
     * boarding/drop stops.
     */
    let bestPair = null

    for (
      const originStop of
        route.stops
    ) {
      const originStopLat =
        Number(
          originStop.lat
        )

      const originStopLng =
        Number(
          originStop.lng
        )

      /*
       * Ignore invalid stop coordinates.
       */
      if (
        !Number.isFinite(
          originStopLat
        ) ||
        !Number.isFinite(
          originStopLng
        )
      ) {
        continue
      }

      const originDistance =
        haversineKm(
          lat1,
          lng1,
          originStopLat,
          originStopLng
        )

      /*
       * Origin must be close enough
       * to an actual stop.
       */
      if (
        originDistance >
        maxStopDistance
      ) {
        continue
      }

      for (
        const destinationStop of
          route.stops
      ) {
        /*
         * Destination must occur
         * after the boarding stop.
         */
        if (
          Number(
            originStop.stopOrder
          ) >=
          Number(
            destinationStop.stopOrder
          )
        ) {
          continue
        }

        /*
         * For trains, do not allow the
         * exact same station to be used
         * as both origin and destination.
         */
        if (
          type === 'train' &&
          String(
            originStop.id
          ) ===
            String(
              destinationStop.id
            )
        ) {
          continue
        }

        const destinationStopLat =
          Number(
            destinationStop.lat
          )

        const destinationStopLng =
          Number(
            destinationStop.lng
          )

        /*
         * Ignore invalid stop coordinates.
         */
        if (
          !Number.isFinite(
            destinationStopLat
          ) ||
          !Number.isFinite(
            destinationStopLng
          )
        ) {
          continue
        }

        const destinationDistance =
          haversineKm(
            lat2,
            lng2,
            destinationStopLat,
            destinationStopLng
          )

        /*
         * Destination must also be close
         * enough to an actual stop.
         */
        if (
          destinationDistance >
          maxStopDistance
        ) {
          continue
        }

        const accessDistance =
          originDistance +
          destinationDistance

        if (
          !bestPair ||
          accessDistance <
            bestPair.accessDistance
        ) {
          bestPair = {
            originStop,
            destinationStop,
            originDistance,
            destinationDistance,
            accessDistance,
          }
        }
      }
    }

    /*
     * No valid origin/destination stop
     * pair for this route.
     */
    if (!bestPair) {
      continue
    }

    const {
      originStop,
      destinationStop,
      accessDistance,
    } = bestPair

    const rule =
      FARE_RULES[type] || {
        base:
          Number(
            route.baseFare
          ) || 0,

        perKm: 0,
      }

    /*
     * Calculate distance between the
     * selected stops.
     */
    const routeStops =
      route.stops.filter(
        (stop) =>
          Number(
            stop.stopOrder
          ) >=
            Number(
              originStop.stopOrder
            ) &&
          Number(
            stop.stopOrder
          ) <=
            Number(
              destinationStop.stopOrder
            )
      )

    const stopDistance =
      routeStops.reduce(
        (sum, stop) =>
          sum +
          Number(
            stop.distanceFromPrevKm ||
              0
          ),
        0
      )

    /*
     * Never return a zero distance.
     */
    const routeDistance =
      Math.max(
        directDistanceKm,
        stopDistance || 0
      )

    /*
     * Fare based on distance.
     */
    const fare =
      Math.max(
        Number(
          route.baseFare
        ) || 0,

        rule.base +
          routeDistance *
            rule.perKm
      )

    /*
     * Find an available trip.
     *
     * This comes from your existing
     * TransitRoute -> Trip relationship.
     */
    const availableTrips =
      (
        route.trips || []
      ).filter(
        (trip) =>
          Number(
            trip.availableSeats
          ) > 0
      )

    const trip =
      availableTrips[0] ||
      route.trips?.[0] ||
      null

    /*
     * --------------------------------------------------
     * ACTUAL SCHEDULED DURATION
     * --------------------------------------------------
     *
     * Prefer the real Trip schedule.
     *
     * Example:
     *
     * departureTime = 08:30
     * arrivalTime   = 10:00
     *
     * durationMinutes = 90
     */
    const scheduledDuration =
      trip
        ? calculateScheduledDuration(
            trip.departureTime,
            trip.arrivalTime
          )
        : null

    /*
     * Keep the old distance-based
     * calculation as a fallback.
     */
    let fallbackSpeedMultiplier =
      3.5

    if (
      type === 'train'
    ) {
      fallbackSpeedMultiplier =
        2.2
    } else if (
      type === 'bus'
    ) {
      fallbackSpeedMultiplier =
        3.2
    } else if (
      type === 'auto'
    ) {
      fallbackSpeedMultiplier =
        3.5
    }

    const fallbackDurationMinutes =
      Math.max(
        8,
        Math.round(
          routeDistance *
            fallbackSpeedMultiplier
        )
      )

    /*
     * Actual trip schedule wins.
     */
    const durationMinutes =
      scheduledDuration ??
      fallbackDurationMinutes

    /*
     * Format actual trip times for
     * the frontend.
     */
    const departureTime =
      trip
        ? formatTime(
            trip.departureTime
          )
        : null

    const arrivalTime =
      trip
        ? formatTime(
            trip.arrivalTime
          )
        : null

    candidates.push({
      routeId:
        route.id,

      stops:
        routeStops,

      routeName:
        route.routeName,

      routeNumber:
        route.routeNumber,

      transitType:
        type,

      origin:
        route.origin,

      destination:
        route.destination,

      boardingStop:
        stopModel(
          originStop
        ),

      dropStop:
        stopModel(
          destinationStop
        ),

      distanceKm:
        Number(
          routeDistance.toFixed(2)
        ),

      accessDistanceKm:
        Number(
          accessDistance.toFixed(2)
        ),

      /*
       * Actual scheduled duration.
       */
      durationMinutes,

      /*
       * Actual scheduled departure.
       */
      departureTime,

      /*
       * Actual scheduled arrival.
       */
      arrivalTime,

      estimatedFare:
        Number(
          fare.toFixed(2)
        ),

      /*
       * Important for frontend booking.
       */
      tripId:
        trip?.id || null,

      trip:
        trip
          ? tripModel(
              trip
            )
          : null,

      availableSeats:
        trip?.availableSeats ??
        null,
    })
  }

  /*
   * Prefer bookable options first.
   * Then lower fare.
   */
  const unique =
    candidates
      .sort((a, b) => {
        const aBookable =
          a.tripId ? 1 : 0

        const bBookable =
          b.tripId ? 1 : 0

        if (
          aBookable !==
          bBookable
        ) {
          return (
            bBookable -
            aBookable
          )
        }

        return (
          a.estimatedFare -
          b.estimatedFare
        )
      })
      .filter(
        (
          item,
          index,
          arr
        ) =>
          arr.findIndex(
            (candidate) =>
              candidate.transitType ===
              item.transitType
          ) === index
      )

  console.log(
    'JOURNEY SEARCH:',
    {
      directDistanceKm,

      routesChecked:
        routes.length,

      candidatesFound:
        candidates.length,

      optionsReturned:
        unique.map(
          (item) => ({
            routeId:
              item.routeId,

            tripId:
              item.tripId,

            transitType:
              item.transitType,

            fare:
              item.estimatedFare,

            departureTime:
              item.departureTime,

            arrivalTime:
              item.arrivalTime,

            durationMinutes:
              item.durationMinutes,

            availableSeats:
              item.availableSeats,
          })
        ),
    }
  )

  return {
    origin: {
      lat: lat1,
      lng: lng1,
    },

    destination: {
      lat: lat2,
      lng: lng2,
    },

    distanceKm:
      Number(
        directDistanceKm.toFixed(2)
      ),

    options: unique,
  }
}

/*
 * --------------------------------------------------
 * LIVE ROUTE VEHICLES
 * --------------------------------------------------
 */

const getRouteLiveVehicles = async ({
  routeId,
  date,
}) => {
  const route =
    await repo.findRouteWithActiveTrips({
      routeId,
      date,
    })

  if (!route) {
    throw new AppError(
      'Route not found',
      404
    )
  }

  return {
    route:
      routeModel(route),

    stops:
      (
        route.stops || []
      ).map(
        stopModel
      ),

    vehicles:
      (
        route.trips || []
      )
        .filter(
          (trip) =>
            trip.liveTracking
        )
        .map(
          (trip) => ({
            ...tripModel(
              trip
            ),

            liveTracking:
              liveModel(
                trip.liveTracking
              ),
          })
        ),
  }
}

/*
 * --------------------------------------------------
 * EXPORTS
 * --------------------------------------------------
 */

module.exports = {
  getAllRoutes,
  getRouteById,
  getStopsByRoute,
  getNearbyStops,
  getTripsByRoute,
  getLiveTracking,
  estimateFare,
  journeySearch,
  getRouteLiveVehicles,
}