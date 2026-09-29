const asyncHandler = require('../../utils/asyncHandler')
const {
  successResponse,
} = require('../../utils/response')

const driverService = require('./driver.service')

// --------------------------------------------------
// GET DASHBOARD
// --------------------------------------------------

const getDashboard = asyncHandler(
  async (req, res) => {
    const data =
      await driverService.getDashboard(
        req.user.id
      )

    return successResponse(
      res,
      200,
      'Driver dashboard fetched successfully',
      data
    )
  }
)

// --------------------------------------------------
// GET PROFILE
// --------------------------------------------------

const getProfile = asyncHandler(
  async (req, res) => {
    const data =
      await driverService.getProfile(
        req.user.id
      )

    return successResponse(
      res,
      200,
      'Driver profile fetched successfully',
      data
    )
  }
)

// --------------------------------------------------
// UPDATE PROFILE
// --------------------------------------------------

const updateProfile = asyncHandler(
  async (req, res) => {
    const data =
      await driverService.updateProfile(
        req.user.id,
        req.body
      )

    return successResponse(
      res,
      200,
      'Driver profile updated successfully',
      data
    )
  }
)

// --------------------------------------------------
// GET VEHICLES
// --------------------------------------------------

const getVehicles = asyncHandler(
  async (req, res) => {
    const data =
      await driverService.getVehicles(
        req.user.id
      )

    return successResponse(
      res,
      200,
      'Driver vehicles fetched successfully',
      data
    )
  }
)

// --------------------------------------------------
// REQUEST VEHICLE CHANGE
// --------------------------------------------------

const requestVehicleChange = asyncHandler(
  async (req, res) => {
    const data =
      await driverService.requestVehicleChange({
        userId: req.user.id,

        vehicleNumber:
          req.body.vehicleNumber,

        vehicleType:
          req.body.vehicleType,

        brand:
          req.body.brand,

        model:
          req.body.model,

        color:
          req.body.color,
      })

    return successResponse(
      res,
      201,
      'Vehicle change request submitted successfully',
      data
    )
  }
)

// --------------------------------------------------
// GET VEHICLE CHANGE REQUESTS
// --------------------------------------------------

const getVehicleChangeRequests =
  asyncHandler(async (req, res) => {
    const data =
      await driverService.getVehicleChangeRequests(
        req.user.id
      )

    return successResponse(
      res,
      200,
      'Vehicle change requests fetched successfully',
      data
    )
  })

// --------------------------------------------------
// UPDATE AVAILABILITY
// --------------------------------------------------

const updateAvailability = asyncHandler(
  async (req, res) => {
    const data =
      await driverService.updateAvailability(
        req.user.id,
        req.body.isAvailable
      )

    return successResponse(
      res,
      200,
      'Driver availability updated successfully',
      data
    )
  }
)

module.exports = {
  getDashboard,
  getProfile,
  updateProfile,
  getVehicles,
  requestVehicleChange,
  getVehicleChangeRequests,
  updateAvailability,
}