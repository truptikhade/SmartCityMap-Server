const express     = require('express')
const router      = express.Router()
const controller  = require('./transit.controller')
const { protect, restrictTo } = require('../../middleware/auth.middleware')

// Public routes
router.get('/routes',              controller.getAllRoutes)
router.get('/routes/:id',          controller.getRouteById)
router.get('/routes/:id/stops',    controller.getStops)
router.get('/routes/:id/trips',    controller.getTrips)
router.get('/stops/nearby',        controller.getNearbyStops)
router.get('/live/:tripId',        controller.getLive)
router.get('/fare/estimate',       controller.fareEstimate)

module.exports = router