const asyncHandler        = require('../../utils/asyncHandler')
const { successResponse } = require('../../utils/response')
const transitService      = require('./transit.service')

const getAllRoutes = asyncHandler(async (req, res) => {
  const routes = await transitService.getAllRoutes(req.query.type)
  return successResponse(res, 200, 'Routes fetched', routes)
})

const getRouteById = asyncHandler(async (req, res) => {
  const route = await transitService.getRouteById(req.params.id)
  return successResponse(res, 200, 'Route fetched', route)
})

const getStops = asyncHandler(async (req, res) => {
  const stops = await transitService.getStopsByRoute(req.params.id)
  return successResponse(res, 200, 'Stops fetched', stops)
})

const getNearbyStops = asyncHandler(async (req, res) => {
  const { lat, lng, radius } = req.query
  const stops = await transitService.getNearbyStops({ lat, lng, radius })
  return successResponse(res, 200, 'Nearby stops fetched', stops)
})

const getTrips = asyncHandler(async (req, res) => {
  const trips = await transitService.getTripsByRoute({
    routeId: req.params.id,
    date:    req.query.date,
  })
  return successResponse(res, 200, 'Trips fetched', trips)
})

const getLive = asyncHandler(async (req, res) => {
  const live = await transitService.getLiveTracking(req.params.tripId)
  return successResponse(res, 200, 'Live tracking fetched', live)
})

const fareEstimate = asyncHandler(async (req, res) => {
  const { routeId, distanceKm } = req.query
  const result = await transitService.estimateFare({
    routeId,
    distanceKm: parseFloat(distanceKm),
  })
  return successResponse(res, 200, 'Fare estimated', result)
})

module.exports = {
  getAllRoutes, getRouteById,
  getStops, getNearbyStops,
  getTrips, getLive, fareEstimate,
}