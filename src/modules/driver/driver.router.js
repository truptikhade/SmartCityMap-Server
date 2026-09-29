const express = require('express')

const router = express.Router()

const controller = require('./driver.controller')

const {
  protect,
  restrictTo,
} = require('../../middleware/auth.middleware')

router.use(
  protect,
  restrictTo('driver')
)

// Dashboard
router.get(
  '/dashboard',
  controller.getDashboard
)

// Profile
router.get(
  '/profile',
  controller.getProfile
)

router.put(
  '/profile',
  controller.updateProfile
)

// Vehicles
router.get(
  '/vehicles',
  controller.getVehicles
)

router.post(
  '/vehicles',
  controller.requestVehicleChange
)

// Vehicle change request history
router.get(
  '/vehicle-change-requests',
  controller.getVehicleChangeRequests
)

// Availability
router.put(
  '/availability',
  controller.updateAvailability
)

module.exports = router