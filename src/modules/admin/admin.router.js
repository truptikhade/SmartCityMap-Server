const express = require('express')

const router = express.Router()

const controller = require('./admin.controller')

const {
  protect,
  restrictTo,
} = require('../../middleware/auth.middleware')

router.use(
  protect,
  restrictTo('admin')
)

// --------------------------------------------------
// DRIVER APPROVAL
// --------------------------------------------------

router.get(
  '/drivers',
  controller.getAllDrivers
)

router.get(
  '/drivers/:driverId',
  controller.getDriverById
)

router.put(
  '/drivers/:driverId/approve',
  controller.approveDriver
)

router.put(
  '/drivers/:driverId/reject',
  controller.rejectDriver
)

// --------------------------------------------------
// VEHICLE CHANGE REQUESTS
// --------------------------------------------------

router.get(
  '/vehicle-change-requests',
  controller.getPendingVehicleChangeRequests
)

router.put(
  '/vehicle-change-requests/:requestId/approve',
  controller.approveVehicleChangeRequest
)

router.put(
  '/vehicle-change-requests/:requestId/reject',
  controller.rejectVehicleChangeRequest
)

module.exports = router