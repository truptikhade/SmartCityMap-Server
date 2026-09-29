const express = require('express')

const router = express.Router()

const controller = require('./ride.controller')

const {
  createRideSchema,
  acceptRideSchema,
  verifyOtpSchema,
  completeRideSchema,
} = require('./ride.validation')

const {
  protect,
  restrictTo,
} = require('../../middleware/auth.middleware')

const validate = require('../../middleware/validate.middleware')

// ─────────────────────────────────────────────────────────
// AUTHENTICATION
// ─────────────────────────────────────────────────────────

router.use(protect)

// ─────────────────────────────────────────────────────────
// PASSENGER ROUTES
// ─────────────────────────────────────────────────────────

// Create a new on-demand ride
router.post(
  '/',
  restrictTo('user'),
  validate(createRideSchema),
  controller.createRide
)

// Get passenger's rides
router.get(
  '/passenger',
  restrictTo('user'),
  controller.getPassengerRides
)

// Find drivers matching the requested vehicle type
router.get(
  '/matching-drivers',
  restrictTo('user'),
  controller.findMatchingDrivers
)

// Get currently available drivers
router.get(
  '/available-drivers',
  restrictTo('user'),
  controller.getAvailableDrivers
)

// Cancel ride
router.put(
  '/:rideId/cancel',
  restrictTo('user', 'driver'),
  controller.cancelRide
)

// ─────────────────────────────────────────────────────────
// DRIVER ROUTES
// ─────────────────────────────────────────────────────────

// Get driver's rides
router.get(
  '/driver',
  restrictTo('driver'),
  controller.getDriverRides
)

// Accept ride
router.put(
  '/:rideId/accept',
  restrictTo('driver'),
  validate(acceptRideSchema),
  controller.acceptRide
)

// Driver is travelling to passenger
router.put(
  '/:rideId/arriving',
  restrictTo('driver'),
  controller.driverArriving
)

// Driver has reached passenger
router.put(
  '/:rideId/arrived',
  restrictTo('driver'),
  controller.driverArrived
)

// Verify passenger OTP
router.put(
  '/:rideId/verify-otp',
  restrictTo('driver'),
  validate(verifyOtpSchema),
  controller.verifyOtp
)

// Start ride
router.put(
  '/:rideId/start',
  restrictTo('driver'),
  controller.startRide
)

// Complete ride
router.put(
  '/:rideId/complete',
  restrictTo('driver'),
  validate(completeRideSchema),
  controller.completeRide
)

// ─────────────────────────────────────────────────────────
// COMMON RIDE DETAILS
// ─────────────────────────────────────────────────────────

// IMPORTANT:
// Keep this dynamic route AFTER all named routes.
// Otherwise "/matching-drivers" can be interpreted as rideId.
router.get(
  '/:rideId',
  restrictTo(
    'user',
    'driver',
    'admin'
  ),
  controller.getRide
)

module.exports = router