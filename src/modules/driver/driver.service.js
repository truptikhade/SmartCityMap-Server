const AppError = require('../../utils/AppError')
const repo = require('./driver.repository')
const {
  driverModel,
  vehicleChangeRequestModel,
} = require('./driver.model')
const {
  rideModel,
  rideListModel,
} = require('../ride/ride.model')

// GET DRIVER DASHBOARD
const getDashboard = async (userId) => {
  const driver = await repo.findDriverByUserId(userId)

  if (!driver) {
    throw new AppError('Driver profile not found', 404)
  }

  const activeVehicle = await repo.findActiveDriverVehicle(userId)

  const [
    summary,
    pendingRequests,
    activeRide,
    recentRides,
  ] = await Promise.all([
    repo.getRideSummary(userId),

    activeVehicle
      ? repo.findPendingRideRequests({
          vehicleType: activeVehicle.vehicleType,
        })
      : Promise.resolve([]),

    repo.findActiveRide(userId),

    repo.findRecentRides(userId, 10),
  ])

  return {
    driver: driverModel(driver),

    availability: {
      isApproved: driver.isApproved,
      isAvailable: driver.isAvailable,
    },

    summary: {
      totalTrips: summary.totalTrips,
      completedTrips: summary.completedTrips,
      cancelledTrips: summary.cancelledTrips,
      totalEarnings: summary.totalEarnings,
    },

    pendingRequests: rideListModel(pendingRequests),

    activeRide: activeRide
      ? rideModel(activeRide)
      : null,

    recentRides: rideListModel(recentRides),
  }
}

// GET PENDING RIDES
const getPendingRequests = async (userId) => {
  const driver = await repo.findDriverByUserId(userId)

  if (!driver) {
    throw new AppError('Driver profile not found', 404)
  }

  if (!driver.isApproved) {
    throw new AppError(
      'Your driver account is waiting for admin approval',
      403
    )
  }

  const activeVehicle =
    await repo.findActiveDriverVehicle(userId)

  if (!activeVehicle) {
    return []
  }

  const rides =
    await repo.findPendingRideRequests({
      vehicleType: activeVehicle.vehicleType,
    })

  return rideListModel(rides)
}

// GET PROFILE
const getProfile = async (userId) => {
  const driver = await repo.findDriverByUserId(userId)

  if (!driver) {
    throw new AppError('Driver profile not found', 404)
  }

  return driverModel(driver)
}

// UPDATE PROFILE
const updateProfile = async ({
  userId,
  fname,
  lname,
  email,
  phone,
}) => {
  const driver = await repo.findDriverByUserId(userId)

  if (!driver) {
    throw new AppError('Driver profile not found', 404)
  }

  if (
    fname !== undefined &&
    (!String(fname).trim() ||
      String(fname).length > 100)
  ) {
    throw new AppError(
      'Valid first name is required',
      400
    )
  }

  if (
    lname !== undefined &&
    String(lname).length > 100
  ) {
    throw new AppError(
      'Last name is too long',
      400
    )
  }

  if (
    email !== undefined &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new AppError(
      'Valid email is required',
      400
    )
  }

  if (
    phone !== undefined &&
    !/^[0-9+\-\s]{7,20}$/.test(phone)
  ) {
    throw new AppError(
      'Valid phone number is required',
      400
    )
  }

  try {
    const updatedUser =
      await repo.updateDriverProfile({
        userId,
        fname:
          fname !== undefined
            ? String(fname).trim()
            : undefined,
        lname:
          lname !== undefined
            ? String(lname).trim()
            : undefined,
        email:
          email !== undefined
            ? String(email)
                .trim()
                .toLowerCase()
            : undefined,
        phone:
          phone !== undefined
            ? String(phone).trim()
            : undefined,
      })

    return {
      ...driverModel(driver),

      user: {
        ...driverModel(driver).user,
        ...updatedUser,
      },
    }
  } catch (error) {
    if (error?.code === 'P2002') {
      throw new AppError(
        'Email or phone number is already in use',
        409
      )
    }

    throw error
  }
}

// UPDATE AVAILABILITY
const updateAvailability = async ({
  userId,
  isAvailable,
}) => {
  const driver = await repo.findDriverByUserId(userId)

  if (!driver) {
    throw new AppError(
      'Driver profile not found',
      404
    )
  }

  if (!driver.isApproved) {
    throw new AppError(
      'Your driver account is waiting for admin approval',
      403
    )
  }

  if (typeof isAvailable !== 'boolean') {
    throw new AppError(
      'isAvailable must be true or false',
      400
    )
  }

  if (!isAvailable) {
    const activeRide =
      await repo.findActiveRide(userId)

    if (activeRide) {
      throw new AppError(
        'You cannot go offline while you have an active ride',
        400
      )
    }
  }

  const updatedDriver =
    await repo.updateAvailability({
      userId,
      isAvailable,
    })

  return {
    isApproved: updatedDriver.isApproved,
    isAvailable: updatedDriver.isAvailable,
  }
}

// GET VEHICLES
const getVehicles = async (userId) => {
  const driver =
    await repo.findDriverByUserId(userId)

  if (!driver) {
    throw new AppError(
      'Driver profile not found',
      404
    )
  }

  return repo.findDriverVehicles(userId)
}

// REQUEST VEHICLE CHANGE
const requestVehicleChange = async ({
  userId,
  vehicleNumber,
  vehicleType,
  brand,
  model,
  color,
}) => {
  const driver =
    await repo.findDriverByUserId(userId)

  if (!driver) {
    throw new Error(
      'Driver profile not found'
    )
  }

  if (!driver.isApproved) {
    throw new Error(
      'Your driver account is not approved yet'
    )
  }

  if (!vehicleNumber) {
    throw new Error(
      'Vehicle number is required'
    )
  }

  if (!vehicleType) {
    throw new Error(
      'Vehicle type is required'
    )
  }

  const normalizedVehicleNumber =
    vehicleNumber.trim().toUpperCase()

  const normalizedVehicleType =
    vehicleType.trim()

  return repo.createVehicleChangeRequest({
    userId,
    vehicleNumber:
      normalizedVehicleNumber,
    vehicleType:
      normalizedVehicleType,
    brand:
      brand?.trim() || null,
    model:
      model?.trim() || null,
    color:
      color?.trim() || null,
  })
}

// GET VEHICLE CHANGE REQUESTS
const getVehicleChangeRequests = async (
  userId
) => {
  const requests =
    await repo.findVehicleChangeRequests(userId)

  return requests.map(
    vehicleChangeRequestModel
  )
}

module.exports = {
  getDashboard,
  getPendingRequests,
  getProfile,
  updateProfile,
  updateAvailability,
  getVehicles,
  requestVehicleChange,
  getVehicleChangeRequests,
}