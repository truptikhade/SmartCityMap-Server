const AppError = require('../../utils/AppError')
const repo     = require('./transit.repository')
const { routeModel, stopModel, tripModel, liveModel } = require('./transit.model')

const getAllRoutes = async (transitType) => {
  const routes = await repo.findAllRoutes(transitType)
  return routes.map(routeModel)
}

const getRouteById = async (id) => {
  const route = await repo.findRouteById(id)
  if (!route) throw new AppError('Route not found', 404)
  return routeModel(route)
}

const getStopsByRoute = async (routeId) => {
  const route = await repo.findRouteById(routeId)
  if (!route) throw new AppError('Route not found', 404)

  const stops = await repo.findStopsByRoute(routeId)
  return stops.map(stopModel)
}

const getNearbyStops = async ({ lat, lng, radius }) => {
  if (!lat || !lng) throw new AppError('Latitude and longitude required', 400)

  const stops = await repo.findNearbyStops({
    lat:    parseFloat(lat),
    lng:    parseFloat(lng),
    radius: radius ? parseInt(radius) : 1500,
  })
  return stops.map(stopModel)
}

const getTripsByRoute = async ({ routeId, date }) => {
  if (!date) throw new AppError('Travel date is required', 400)

  const route = await repo.findRouteById(routeId)
  if (!route) throw new AppError('Route not found', 404)

  const trips = await repo.findTripsByRoute({ routeId, date })
  return trips.map(tripModel)
}

const getLiveTracking = async (tripId) => {
  const live = await repo.findLiveTracking(tripId)
  if (!live) throw new AppError('Live tracking not available for this trip', 404)
  return liveModel(live)
}

const estimateFare = async ({ routeId, distanceKm }) => {
  const route = await repo.findRouteById(routeId)
  if (!route)            throw new AppError('Route not found', 404)
  if (!distanceKm || distanceKm <= 0) throw new AppError('Valid distance required', 400)

  return {
    routeId,
    transitType:   route.transitType,
    distanceKm,
    baseFare:      route.baseFare,
    estimatedFare: Math.round(route.baseFare * 100) / 100,
  }
}

module.exports = {
  getAllRoutes,
  getRouteById,
  getStopsByRoute,
  getNearbyStops,
  getTripsByRoute,
  getLiveTracking,
  estimateFare,
}