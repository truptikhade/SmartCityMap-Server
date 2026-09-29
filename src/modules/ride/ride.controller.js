const asyncHandler = require('../../utils/asyncHandler')

const {
  successResponse,
} = require('../../utils/response')

const rideService = require('./ride.service')

// ─────────────────────────────────────────────────────────
// CREATE RIDE
// ─────────────────────────────────────────────────────────

const createRide = asyncHandler(
  async (req, res) => {
    const data =
      await rideService.createRide({
        passengerId: req.user.id,
        ...req.body,
      })

    return successResponse(
      res,
      201,
      'Ride request created successfully',
      data
    )
  }
)

// ─────────────────────────────────────────────────────────
// GET RIDE BY ID
// ─────────────────────────────────────────────────────────

const getRide = asyncHandler(
  async (req, res) => {
    const { rideId } = req.params

    const data =
      await rideService.getRide({
        rideId,
        userId: req.user.id,
        role: req.user.role,
      })

    return successResponse(
      res,
      200,
      'Ride fetched successfully',
      data
    )
  }
)

// ─────────────────────────────────────────────────────────
// GET PASSENGER RIDES
// ─────────────────────────────────────────────────────────

const getPassengerRides =
  asyncHandler(
    async (req, res) => {
      const data =
        await rideService.getPassengerRides(
          req.user.id
        )

      return successResponse(
        res,
        200,
        'Passenger rides fetched successfully',
        data
      )
    }
  )

// ─────────────────────────────────────────────────────────
// GET DRIVER RIDES
// ─────────────────────────────────────────────────────────

const getDriverRides =
  asyncHandler(
    async (req, res) => {
      const data =
        await rideService.getDriverRides(
          req.user.id
        )

      return successResponse(
        res,
        200,
        'Driver rides fetched successfully',
        data
      )
    }
  )

// ─────────────────────────────────────────────────────────
// GET AVAILABLE DRIVERS
// ─────────────────────────────────────────────────────────

const getAvailableDrivers =
  asyncHandler(
    async (req, res) => {
      const {
        vehicleType,
      } = req.query

      if (
        ![
          'car',
          'twoWheeler',
          'auto',
        ].includes(vehicleType)
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Valid vehicleType is required',
        })
      }

      const data =
        await rideService.getAvailableDrivers({
          vehicleType,
        })

      return successResponse(
        res,
        200,
        'Available drivers fetched successfully',
        data
      )
    }
  )

// ─────────────────────────────────────────────────────────
// ACCEPT RIDE
// ─────────────────────────────────────────────────────────

const acceptRide = asyncHandler(
  async (req, res) => {
    const { rideId } = req.params

    const data =
      await rideService.acceptRide({
        rideId,
        driverId: req.user.id,
        vehicleId: req.body.vehicleId,
      })

    return successResponse(
      res,
      200,
      'Ride accepted successfully',
      data
    )
  }
)

// ─────────────────────────────────────────────────────────
// DRIVER ARRIVING
// ─────────────────────────────────────────────────────────

const driverArriving =
  asyncHandler(
    async (req, res) => {
      const { rideId } = req.params

      const data =
        await rideService.driverArriving({
          rideId,
          driverId: req.user.id,
        })

      return successResponse(
        res,
        200,
        'Driver is on the way',
        data
      )
    }
  )

// ─────────────────────────────────────────────────────────
// DRIVER ARRIVED
// ─────────────────────────────────────────────────────────

const driverArrived =
  asyncHandler(
    async (req, res) => {
      const { rideId } = req.params

      const data =
        await rideService.driverArrived({
          rideId,
          driverId: req.user.id,
        })

      return successResponse(
        res,
        200,
        'Driver has arrived',
        data
      )
    }
  )

// ─────────────────────────────────────────────────────────
// VERIFY OTP
// ─────────────────────────────────────────────────────────

const verifyOtp = asyncHandler(
  async (req, res) => {
    const { rideId } = req.params

    const data =
      await rideService.verifyRideOtp({
        rideId,
        driverId: req.user.id,
        otp: req.body.otp,
      })

    return successResponse(
      res,
      200,
      'Ride OTP verified successfully',
      data
    )
  }
)

// ─────────────────────────────────────────────────────────
// START RIDE
// ─────────────────────────────────────────────────────────

const startRide = asyncHandler(
  async (req, res) => {
    const { rideId } = req.params

    const data =
      await rideService.startRide({
        rideId,
        driverId: req.user.id,
      })

    return successResponse(
      res,
      200,
      'Ride started successfully',
      data
    )
  }
)

// ─────────────────────────────────────────────────────────
// COMPLETE RIDE
// ─────────────────────────────────────────────────────────

const completeRide =
  asyncHandler(
    async (req, res) => {
      const { rideId } = req.params

      const data =
        await rideService.completeRide({
          rideId,
          driverId: req.user.id,
          finalFare: req.body.finalFare,
        })

      return successResponse(
        res,
        200,
        'Ride completed successfully',
        data
      )
    }
  )

// ─────────────────────────────────────────────────────────
// CANCEL RIDE
// ─────────────────────────────────────────────────────────

const cancelRide = asyncHandler(
  async (req, res) => {
    const { rideId } = req.params

    const data =
      await rideService.cancelRide({
        rideId,
        userId: req.user.id,
      })

    return successResponse(
      res,
      200,
      'Ride cancelled successfully',
      data
    )
  }
)

const findMatchingDrivers =
  asyncHandler(async (req, res) => {
    const { vehicleType } = req.query

    const data =
      await rideService.findMatchingDrivers({
        vehicleType,
      })

    return successResponse(
      res,
      200,
      'Matching drivers fetched successfully',
      data
    )
  })

// ─────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────

module.exports = {
  createRide,
  getRide,
  getPassengerRides,
  getDriverRides,
  getAvailableDrivers,
  acceptRide,
  driverArriving,
  driverArrived,
  verifyOtp,
  startRide,
  completeRide,
  cancelRide,
  findMatchingDrivers,
}