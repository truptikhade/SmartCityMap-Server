const adminRepository = require('./admin.repository')
const { driverModel } = require('./admin.model')

// --------------------------------------------------
// GET ALL DRIVERS
// --------------------------------------------------

const getAllDrivers = async () => {
  const drivers =
    await adminRepository.findAllDrivers()

  return drivers.map(driverModel)
}

// --------------------------------------------------
// GET DRIVER BY ID
// --------------------------------------------------

const getDriverById = async (driverId) => {
  const driver =
    await adminRepository.findDriverById(
      driverId
    )

  if (!driver) {
    throw new Error('Driver not found')
  }

  return driverModel(driver)
}

// --------------------------------------------------
// APPROVE DRIVER
// --------------------------------------------------

const approveDriver = async (driverId) => {
  const driver =
    await adminRepository.findDriverById(
      driverId
    )

  if (!driver) {
    throw new Error('Driver not found')
  }

  if (driver.user?.role !== 'driver') {
    throw new Error(
      'Selected account is not a driver'
    )
  }

  if (driver.isApproved) {
    throw new Error(
      'Driver is already approved'
    )
  }

  const updatedDriver =
    await adminRepository.approveDriver(
      driverId
    )

  return driverModel(updatedDriver)
}

// --------------------------------------------------
// REJECT DRIVER
// --------------------------------------------------

const rejectDriver = async (driverId) => {
  const driver =
    await adminRepository.findDriverById(
      driverId
    )

  if (!driver) {
    throw new Error('Driver not found')
  }

  if (driver.user?.role !== 'driver') {
    throw new Error(
      'Selected account is not a driver'
    )
  }

  if (!driver.isApproved) {
    throw new Error(
      'Driver is already pending or rejected'
    )
  }

  const updatedDriver =
    await adminRepository.rejectDriver(
      driverId
    )

  return driverModel(updatedDriver)
}

// --------------------------------------------------
// GET PENDING VEHICLE CHANGE REQUESTS
// --------------------------------------------------

const getPendingVehicleChangeRequests =
  async () => {
    return adminRepository
      .findPendingVehicleChangeRequests()
  }

// --------------------------------------------------
// APPROVE VEHICLE CHANGE REQUEST
// --------------------------------------------------

const approveVehicleChangeRequest =
  async (requestId) => {
    const request =
      await adminRepository
        .findVehicleChangeRequestById(
          requestId
        )

    if (!request) {
      throw new Error(
        'Vehicle change request not found'
      )
    }

    if (request.status !== 'PENDING') {
      throw new Error(
        'This vehicle change request has already been reviewed'
      )
    }

    const result =
      await adminRepository
        .approveVehicleChangeRequest(
          requestId
        )

    return result
  }

// --------------------------------------------------
// REJECT VEHICLE CHANGE REQUEST
// --------------------------------------------------

const rejectVehicleChangeRequest =
  async (requestId) => {
    const request =
      await adminRepository
        .findVehicleChangeRequestById(
          requestId
        )

    if (!request) {
      throw new Error(
        'Vehicle change request not found'
      )
    }

    if (request.status !== 'PENDING') {
      throw new Error(
        'This vehicle change request has already been reviewed'
      )
    }

    return adminRepository
      .rejectVehicleChangeRequest(
        requestId
      )
  }

module.exports = {
  getAllDrivers,
  getDriverById,
  approveDriver,
  rejectDriver,

  getPendingVehicleChangeRequests,
  approveVehicleChangeRequest,
  rejectVehicleChangeRequest,
}