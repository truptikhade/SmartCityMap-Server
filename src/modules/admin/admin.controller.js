const asyncHandler = require('../../utils/asyncHandler')
const {
  successResponse,
} = require('../../utils/response')

const adminService = require('./admin.service')

// --------------------------------------------------
// DRIVERS
// --------------------------------------------------

const getAllDrivers = asyncHandler(
  async (req, res) => {
    const data =
      await adminService.getAllDrivers()

    return successResponse(
      res,
      200,
      'Drivers fetched successfully',
      data
    )
  }
)

const getDriverById = asyncHandler(
  async (req, res) => {
    const { driverId } = req.params

    const data =
      await adminService.getDriverById(
        driverId
      )

    return successResponse(
      res,
      200,
      'Driver fetched successfully',
      data
    )
  }
)

const approveDriver = asyncHandler(
  async (req, res) => {
    const { driverId } = req.params

    const data =
      await adminService.approveDriver(
        driverId
      )

    return successResponse(
      res,
      200,
      'Driver approved successfully',
      data
    )
  }
)

const rejectDriver = asyncHandler(
  async (req, res) => {
    const { driverId } = req.params

    const data =
      await adminService.rejectDriver(
        driverId
      )

    return successResponse(
      res,
      200,
      'Driver rejected successfully',
      data
    )
  }
)

// --------------------------------------------------
// VEHICLE CHANGE REQUESTS
// --------------------------------------------------

const getPendingVehicleChangeRequests =
  asyncHandler(async (req, res) => {
    const data =
      await adminService
        .getPendingVehicleChangeRequests()

    return successResponse(
      res,
      200,
      'Vehicle change requests fetched successfully',
      data
    )
  })

const approveVehicleChangeRequest =
  asyncHandler(async (req, res) => {
    const { requestId } = req.params

    const data =
      await adminService
        .approveVehicleChangeRequest(
          requestId
        )

    return successResponse(
      res,
      200,
      'Vehicle change request approved successfully',
      data
    )
  })

const rejectVehicleChangeRequest =
  asyncHandler(async (req, res) => {
    const { requestId } = req.params

    const data =
      await adminService
        .rejectVehicleChangeRequest(
          requestId
        )

    return successResponse(
      res,
      200,
      'Vehicle change request rejected successfully',
      data
    )
  })

module.exports = {
  getAllDrivers,
  getDriverById,
  approveDriver,
  rejectDriver,

  getPendingVehicleChangeRequests,
  approveVehicleChangeRequest,
  rejectVehicleChangeRequest,
}