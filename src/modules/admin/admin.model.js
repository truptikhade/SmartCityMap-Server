const driverModel = (driver) => {
  if (!driver) {
    return null
  }

  return {
    id: driver.id,

    user: driver.user
      ? {
          id: driver.user.id,
          fname: driver.user.fname,
          lname: driver.user.lname,
          email: driver.user.email,
          phone: driver.user.phone,
          role: driver.user.role,
          isVerified: driver.user.isVerified,
          isActive: driver.user.isActive,
          createdAt: driver.user.createdAt,
        }
      : null,

    licenseNumber:
      driver.licenseNumber,

    isApproved:
      driver.isApproved,

    isAvailable:
      driver.isAvailable,

    vehicles: (
      driver.vehicles || []
    ).map((vehicle) => ({
      id: vehicle.id,
      vehicleNumber:
        vehicle.vehicleNumber,
      vehicleType:
        vehicle.vehicleType,
      brand: vehicle.brand,
      model: vehicle.model,
      color: vehicle.color,
      isActive: vehicle.isActive,
      approvalStatus:
        vehicle.approvalStatus ||
        'APPROVED',
    })),

    createdAt:
      driver.createdAt,

    updatedAt:
      driver.updatedAt,
  }
}

// --------------------------------------------------
// VEHICLE CHANGE REQUEST MODEL
// --------------------------------------------------

const vehicleChangeRequestModel = (
  request
) => {
  if (!request) {
    return null
  }

  return {
    id: request.id,

    driverId:
      request.driverId,

    vehicleId:
      request.vehicleId,

    driver: request.driver
      ? {
          id: request.driver.id,

          user: request.driver.user
            ? {
                id:
                  request.driver.user.id,
                fname:
                  request.driver.user.fname,
                lname:
                  request.driver.user.lname,
                email:
                  request.driver.user.email,
                phone:
                  request.driver.user.phone,
                role:
                  request.driver.user.role,
              }
            : null,

          licenseNumber:
            request.driver.licenseNumber,

          isApproved:
            request.driver.isApproved,
        }
      : null,

    currentVehicle:
      request.vehicle
        ? {
            id:
              request.vehicle.id,

            vehicleNumber:
              request.vehicle.vehicleNumber,

            vehicleType:
              request.vehicle.vehicleType,

            brand:
              request.vehicle.brand,

            model:
              request.vehicle.model,

            color:
              request.vehicle.color,

            isActive:
              request.vehicle.isActive,
          }
        : null,

    requestedVehicle: {
      vehicleNumber:
        request.vehicleNumber,

      vehicleType:
        request.vehicleType,

      brand:
        request.brand,

      model:
        request.model,

      color:
        request.color,
    },

    status:
      request.status,

    requestedAt:
      request.requestedAt,

    reviewedAt:
      request.reviewedAt,
  }
}

module.exports = {
  driverModel,
  vehicleChangeRequestModel,
}