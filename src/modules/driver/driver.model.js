const driverModel = (driverProfile) => {
  if (!driverProfile) {
    return null
  }

  return {
    id: driverProfile.id,

    userId: driverProfile.userId,

    licenseNumber: driverProfile.licenseNumber,

    isApproved: driverProfile.isApproved,

    isAvailable: driverProfile.isAvailable,

    user: driverProfile.user
      ? {
          id: driverProfile.user.id,
          fname: driverProfile.user.fname,
          lname: driverProfile.user.lname,
          email: driverProfile.user.email,
          phone: driverProfile.user.phone,
          role: driverProfile.user.role,
          profilePic: driverProfile.user.profilePic,
          isActive: driverProfile.user.isActive,
          isVerified: driverProfile.user.isVerified,
        }
      : null,

    vehicles: (driverProfile.vehicles || []).map(
      (vehicle) => ({
        id: vehicle.id,
        vehicleNumber: vehicle.vehicleNumber,
        vehicleType: vehicle.vehicleType,
        brand: vehicle.brand,
        model: vehicle.model,
        color: vehicle.color,
        isActive: vehicle.isActive,

        // Kept for compatibility with your current UI.
        approvalStatus:
          vehicle.approvalStatus || 'APPROVED',

        requestedAt:
          vehicle.requestedAt || null,

        approvedAt:
          vehicle.approvedAt || null,

        rejectedAt:
          vehicle.rejectedAt || null,

        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt,
      })
    ),

    createdAt: driverProfile.createdAt,

    updatedAt: driverProfile.updatedAt,
  }
}

// --------------------------------------------------
// VEHICLE CHANGE REQUEST MODEL
// --------------------------------------------------

const vehicleChangeRequestModel = (request) => {
  if (!request) {
    return null
  }

  return {
    id: request.id,

    driverId: request.driverId,

    vehicleId: request.vehicleId,

    vehicleNumber: request.vehicleNumber,

    vehicleType: request.vehicleType,

    brand: request.brand,

    model: request.model,

    color: request.color,

    status: request.status,

    requestedAt: request.requestedAt,

    reviewedAt: request.reviewedAt,

    currentVehicle: request.vehicle
      ? {
          id: request.vehicle.id,
          vehicleNumber:
            request.vehicle.vehicleNumber,
          vehicleType:
            request.vehicle.vehicleType,
          brand: request.vehicle.brand,
          model: request.vehicle.model,
          color: request.vehicle.color,
          isActive: request.vehicle.isActive,
        }
      : null,
  }
}

module.exports = {
  driverModel,
  vehicleChangeRequestModel,
}