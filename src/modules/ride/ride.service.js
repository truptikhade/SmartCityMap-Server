const crypto = require('crypto')

const rideRepository = require('./ride.repository')
const { rideModel, rideListModel } = require('./ride.model')
const AppError = require('../../utils/AppError')

const {
  emitNewRideRequest,
  emitRideUpdate,
} = require('../../sockets/ride.socket')

// --------------------------------------------------
// Helpers
// --------------------------------------------------

const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

const hashOtp = (otp) => {
  return crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex')
}

const verifyOtpHash = (otp, otpHash) => {
  return hashOtp(otp) === otpHash
}

const notifyRideUpdate = (ride) => {
  try {
    if (global.io) {
      emitRideUpdate({
        io: global.io,
        ride,
      })
    }
  } catch (error) {
    console.error(
      'Ride socket update error:',
      error.message
    )
  }
}

// --------------------------------------------------
// Create Ride
// --------------------------------------------------

const createRide = async ({
  passengerId,
  pickupLat,
  pickupLng,
  pickupAddress,
  destinationLat,
  destinationLng,
  destinationAddress,
  distanceKm,
  durationMinutes,
  estimatedFare,
  vehicleType,
}) => {
  // Validate passenger
  const passenger =
    await rideRepository.findPassengerById(
      passengerId
    )

  if (!passenger) {
    throw new AppError(
      'Passenger not found',
      404
    )
  }

  // Validate vehicle type
  const validVehicleTypes = [
    'car',
    'twoWheeler',
    'auto',
  ]

  if (!validVehicleTypes.includes(vehicleType)) {
    throw new AppError(
      'Invalid vehicle type',
      400
    )
  }

  // Generate OTP
  const otp = generateOtp()
  const otpHash = hashOtp(otp)

  // Create ride
  const ride =
    await rideRepository.createRideRequest({
      passengerId,
      pickupLat,
      pickupLng,
      pickupAddress,
      destinationLat,
      destinationLng,
      destinationAddress,
      distanceKm,
      durationMinutes,
      estimatedFare,
      vehicleType,
      otpHash,
    })

  const formattedRide =
    rideModel(ride)

  // Emit new ride request to matching drivers
  try {
    if (global.io) {
      emitNewRideRequest({
        io: global.io,
        ride: formattedRide,
      })
    }
  } catch (error) {
    console.error(
      'New ride socket error:',
      error.message
    )
  }

  return {
    ...formattedRide,

    // OTP is returned only when ride is created.
    // It should not be exposed after this point.
    otp,
  }
}

// --------------------------------------------------
// Get Ride
// --------------------------------------------------

const getRide = async ({
  rideId,
  userId,
  role,
}) => {
  const ride =
    await rideRepository.findRideById(
      rideId
    )

  if (!ride) {
    throw new AppError(
      'Ride not found',
      404
    )
  }

  // Passenger can only view own ride
  if (
    role === 'user' &&
    ride.passengerId !== userId
  ) {
    throw new AppError(
      'You do not have permission to view this ride',
      403
    )
  }

  // Driver can only view assigned ride
  if (
    role === 'driver' &&
    ride.driverId !== userId
  ) {
    throw new AppError(
      'You do not have permission to view this ride',
      403
    )
  }

  return rideModel(ride)
}

// --------------------------------------------------
// Passenger Ride History
// --------------------------------------------------

const getPassengerRides = async (
  passengerId
) => {
  const rides =
    await rideRepository.findPassengerRides(
      passengerId
    )

  return rideListModel(rides)
}

// --------------------------------------------------
// Driver Ride History
// --------------------------------------------------

const getDriverRides = async (
  driverId
) => {
  const rides =
    await rideRepository.findDriverRides(
      driverId
    )

  return rideListModel(rides)
}

// --------------------------------------------------
// Available Drivers
// --------------------------------------------------

const getAvailableDrivers = async ({
  vehicleType,
}) => {
  const validVehicleTypes = [
    'car',
    'twoWheeler',
    'auto',
  ]

  if (
    vehicleType &&
    !validVehicleTypes.includes(vehicleType)
  ) {
    throw new AppError(
      'Invalid vehicle type',
      400
    )
  }

  const drivers =
    await rideRepository.findAvailableDrivers({
      vehicleType,
    })

  return drivers
}

// --------------------------------------------------
// Matching Drivers
// --------------------------------------------------

const findMatchingDrivers = async ({
  vehicleType,
}) => {
  const validVehicleTypes = [
    'car',
    'twoWheeler',
    'auto',
  ]

  if (
    !validVehicleTypes.includes(vehicleType)
  ) {
    throw new AppError(
      'Invalid vehicle type',
      400
    )
  }

  const drivers =
    await rideRepository.findAvailableDrivers({
      vehicleType,
    })

  return drivers
}

// --------------------------------------------------
// Accept Ride
// --------------------------------------------------

const acceptRide = async ({
  rideId,
  driverId,
  vehicleId,
}) => {
  // Check ride
  const ride =
    await rideRepository.findRideById(
      rideId
    )

  if (!ride) {
    throw new AppError(
      'Ride not found',
      404
    )
  }

  if (ride.status !== 'REQUESTED') {
    throw new AppError(
      'This ride is no longer available',
      409
    )
  }

  // Check driver
  const driver =
    await rideRepository.findDriverByUserId(
      driverId
    )

  if (!driver) {
    throw new AppError(
      'Driver profile not found',
      404
    )
  }

  if (!driver.isApproved) {
    throw new AppError(
      'Driver account is not approved',
      403
    )
  }

  if (!driver.isAvailable) {
    throw new AppError(
      'Driver is currently offline',
      400
    )
  }

  // Check selected vehicle
  //
  // findAvailableDriverVehicle() returns
  // the driver profile with the selected
  // vehicle inside the vehicles relation.
  const driverWithVehicle =
    await rideRepository.findAvailableDriverVehicle({
      driverId,
      vehicleId,
    })

  if (!driverWithVehicle) {
    throw new AppError(
      'Vehicle not found or inactive',
      404
    )
  }

  const vehicle =
    driverWithVehicle.vehicles?.[0]

  if (!vehicle) {
    throw new AppError(
      'Vehicle not found or inactive',
      404
    )
  }

  // Make sure vehicle type matches requested ride
  if (
    vehicle.vehicleType !==
    ride.vehicleType
  ) {
    throw new AppError(
      `This ride requires a ${ride.vehicleType} vehicle`,
      400
    )
  }

  // Assign driver
  const updatedRide =
    await rideRepository.assignDriver({
      rideId,
      driverId,
      vehicleId,
    })

  const formattedRide =
    rideModel(updatedRide)

  // Notify driver + passenger
  notifyRideUpdate(
    formattedRide
  )

  return formattedRide
}

// --------------------------------------------------
// Driver Arriving
// --------------------------------------------------

const driverArriving = async ({
  rideId,
  driverId,
}) => {
  const ride =
    await rideRepository.findRideById(
      rideId
    )

  if (!ride) {
    throw new AppError(
      'Ride not found',
      404
    )
  }

  if (ride.driverId !== driverId) {
    throw new AppError(
      'You are not assigned to this ride',
      403
    )
  }

  if (ride.status !== 'ACCEPTED') {
    throw new AppError(
      `Ride cannot be marked as arriving from ${ride.status}`,
      400
    )
  }

  const updatedRide =
    await rideRepository.updateRideStatus({
      rideId,
      status: 'DRIVER_ARRIVING',
      data: {
        arrivedAt: null,
      },
    })

  const formattedRide =
    rideModel(updatedRide)

  notifyRideUpdate(
    formattedRide
  )

  return formattedRide
}

// --------------------------------------------------
// Driver Arrived
// --------------------------------------------------

const driverArrived = async ({
  rideId,
  driverId,
}) => {
  const ride =
    await rideRepository.findRideById(
      rideId
    )

  if (!ride) {
    throw new AppError(
      'Ride not found',
      404
    )
  }

  if (ride.driverId !== driverId) {
    throw new AppError(
      'You are not assigned to this ride',
      403
    )
  }

  if (
    ride.status !==
    'DRIVER_ARRIVING'
  ) {
    throw new AppError(
      `Ride cannot be marked as arrived from ${ride.status}`,
      400
    )
  }

  const updatedRide =
    await rideRepository.updateRideStatus({
      rideId,
      status: 'DRIVER_ARRIVED',
      data: {
        arrivedAt: new Date(),
      },
    })

  const formattedRide =
    rideModel(updatedRide)

  notifyRideUpdate(
    formattedRide
  )

  return formattedRide
}

// --------------------------------------------------
// Verify Ride OTP
// --------------------------------------------------

// --------------------------------------------------
// Verify Ride OTP
// --------------------------------------------------

const verifyRideOtp = async ({
  rideId,
  driverId,
  otp,
}) => {
  const ride =
    await rideRepository.findRideById(
      rideId
    )

  if (!ride) {
    throw new AppError(
      'Ride not found',
      404
    )
  }

  // --------------------------------------------------
  // Verify driver assignment
  // --------------------------------------------------
  //
  // Normally ride.driverId should exactly match
  // the authenticated user's id.
  //
  // If there is a legacy/inconsistent ride record,
  // verify that the authenticated driver owns the
  // vehicle assigned to this ride before allowing
  // OTP verification.
  //

  let isAssignedDriver =
    String(ride.driverId || '') ===
    String(driverId || '')

  if (!isAssignedDriver) {
    const driver =
      await rideRepository.findDriverByUserId(
        driverId
      )

    if (!driver) {
      throw new AppError(
        'Driver profile not found',
        404
      )
    }

    const assignedVehicleId =
      ride.vehicleId
        ? String(ride.vehicleId)
        : null

    const ownsAssignedVehicle =
      assignedVehicleId &&
      Array.isArray(driver.vehicles) &&
      driver.vehicles.some(
        (vehicle) =>
          String(vehicle.id) ===
          assignedVehicleId
      )

    if (!ownsAssignedVehicle) {
      throw new AppError(
        'You are not assigned to this ride',
        403
      )
    }

    isAssignedDriver = true
  }

  if (!isAssignedDriver) {
    throw new AppError(
      'You are not assigned to this ride',
      403
    )
  }

  // --------------------------------------------------
  // Ride must be at driver-arrived stage
  // --------------------------------------------------

  if (
    ride.status !==
    'DRIVER_ARRIVED'
  ) {
    throw new AppError(
      'OTP can only be verified after the driver arrives',
      400
    )
  }

  // --------------------------------------------------
  // OTP must exist
  // --------------------------------------------------

  if (!ride.otpHash) {
    throw new AppError(
      'Ride OTP is not available',
      400
    )
  }

  // --------------------------------------------------
  // Validate OTP
  // --------------------------------------------------

  const cleanOtp =
    String(otp || '').trim()

  if (!/^\d{4}$/.test(cleanOtp)) {
    throw new AppError(
      'OTP must be a 4-digit number',
      400
    )
  }

  const isValid =
    verifyOtpHash(
      cleanOtp,
      ride.otpHash
    )

  if (!isValid) {
    throw new AppError(
      'Invalid OTP',
      400
    )
  }

  // --------------------------------------------------
  // Mark OTP as verified
  // --------------------------------------------------

  const updatedRide =
    await rideRepository.updateRideStatus({
      rideId,
      status: 'OTP_VERIFIED',
      data: {},
    })

  const formattedRide =
    rideModel(updatedRide)

  // --------------------------------------------------
  // Notify driver + passenger
  // --------------------------------------------------

  notifyRideUpdate(
    formattedRide
  )

  return formattedRide
}

// --------------------------------------------------
// Start Ride
// --------------------------------------------------

const startRide = async ({
  rideId,
  driverId,
}) => {
  const ride =
    await rideRepository.findRideById(
      rideId
    )

  if (!ride) {
    throw new AppError(
      'Ride not found',
      404
    )
  }

  if (ride.driverId !== driverId) {
    throw new AppError(
      'You are not assigned to this ride',
      403
    )
  }

  if (
    ride.status !==
    'OTP_VERIFIED'
  ) {
    throw new AppError(
      'OTP must be verified before starting the ride',
      400
    )
  }

  const updatedRide =
    await rideRepository.updateRideStatus({
      rideId,
      status: 'IN_PROGRESS',
      data: {
        startedAt: new Date(),
      },
    })

  const formattedRide =
    rideModel(updatedRide)

  notifyRideUpdate(
    formattedRide
  )

  return formattedRide
}

// --------------------------------------------------
// Complete Ride
// --------------------------------------------------

const completeRide = async ({
  rideId,
  driverId,
  finalFare,
}) => {
  const ride =
    await rideRepository.findRideById(
      rideId
    )

  if (!ride) {
    throw new AppError(
      'Ride not found',
      404
    )
  }

  if (ride.driverId !== driverId) {
    throw new AppError(
      'You are not assigned to this ride',
      403
    )
  }

  if (
    ride.status !==
    'IN_PROGRESS'
  ) {
    throw new AppError(
      'Only an active ride can be completed',
      400
    )
  }

  if (
    typeof finalFare !== 'number' ||
    finalFare < 0
  ) {
    throw new AppError(
      'Invalid final fare',
      400
    )
  }

  const updatedRide =
    await rideRepository.completeRide({
      rideId,
      finalFare,
    })

  const formattedRide =
    rideModel(updatedRide)

  notifyRideUpdate(
    formattedRide
  )

  return formattedRide
}

// --------------------------------------------------
// Cancel Ride
// --------------------------------------------------

const cancelRide = async ({
  rideId,
  userId,
}) => {
  const ride =
    await rideRepository.findRideById(
      rideId
    )

  if (!ride) {
    throw new AppError(
      'Ride not found',
      404
    )
  }

  // Passenger can cancel own ride
  const isPassenger =
    ride.passengerId === userId

  // Driver can cancel assigned ride
  const isDriver =
    ride.driverId === userId

  if (!isPassenger && !isDriver) {
    throw new AppError(
      'You do not have permission to cancel this ride',
      403
    )
  }

  const cancellableStatuses = [
    'REQUESTED',
    'ACCEPTED',
    'DRIVER_ARRIVING',
    'DRIVER_ARRIVED',
  ]

  if (
    !cancellableStatuses.includes(
      ride.status
    )
  ) {
    throw new AppError(
      `Ride cannot be cancelled from ${ride.status}`,
      400
    )
  }

  const updatedRide =
    await rideRepository.cancelRide({
      rideId,
    })

  const formattedRide =
    rideModel(updatedRide)

  notifyRideUpdate(
    formattedRide
  )

  return formattedRide
}

// --------------------------------------------------
// Exports
// --------------------------------------------------

module.exports = {
  createRide,
  getRide,
  getPassengerRides,
  getDriverRides,
  getAvailableDrivers,
  findMatchingDrivers,
  acceptRide,
  driverArriving,
  driverArrived,
  verifyRideOtp,
  startRide,
  completeRide,
  cancelRide,
}