const asyncHandler = require('../../utils/asyncHandler')
const { successResponse } = require('../../utils/response')
const transitService = require('./transit.service')

const getAllRoutes = asyncHandler(async (req, res) =>
  successResponse(res, 200, 'Routes fetched', await transitService.getAllRoutes(req.query.type))
)

const getRouteById = asyncHandler(async (req, res) =>
  successResponse(res, 200, 'Route fetched', await transitService.getRouteById(req.params.id))
)

const getStops = asyncHandler(async (req, res) =>
  successResponse(res, 200, 'Stops fetched', await transitService.getStopsByRoute(req.params.id))
)

const getNearbyStops = asyncHandler(async (req, res) => {
  const { lat, lng, radius } = req.query
  return successResponse(res, 200, 'Nearby stops fetched',
    await transitService.getNearbyStops({ lat, lng, radius }))
})

const getTrips = asyncHandler(async (req, res) =>
  successResponse(res, 200, 'Trips fetched',
    await transitService.getTripsByRoute({ routeId: req.params.id, date: req.query.date }))
)

const getLive = asyncHandler(async (req, res) =>
  successResponse(res, 200, 'Live tracking fetched',
    await transitService.getLiveTracking(req.params.tripId))
)

const fareEstimate = asyncHandler(async (req, res) =>
  successResponse(res, 200, 'Fare estimated',
    await transitService.estimateFare({
      routeId: req.query.routeId,
      distanceKm: parseFloat(req.query.distanceKm),
    }))
)

const journeySearch = asyncHandler(async (req, res) =>
  successResponse(res, 200, 'Journey options fetched',
    await transitService.journeySearch(req.query))
)

const getRouteLiveVehicles = asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'no-store')

  return successResponse(
    res,
    200,
    'Route live vehicles fetched',
    await transitService.getRouteLiveVehicles({
      routeId: req.params.id,
      date: req.query.date,
    })
  )
})
module.exports = {
  getAllRoutes,
  getRouteById,
  getStops,
  getNearbyStops,
  getTrips,
  getLive,
  fareEstimate,
  journeySearch,
  getRouteLiveVehicles,
}
