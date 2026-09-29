const rideModel = (ride) => {
  if (!ride) {
    return null
  }

  return {
    id: ride.id,

    passenger: ride.passenger
      ? {
          id: ride.passenger.id,
          fname: ride.passenger.fname,
          lname: ride.passenger.lname,
          email: ride.passenger.email,
          phone: ride.passenger.phone,
          profilePic: ride.passenger.profilePic,
        }
      : null,

    driver: ride.driver
      ? {
          id: ride.driver.id,
          fname: ride.driver.fname,
          lname: ride.driver.lname,
          phone: ride.driver.phone,
          profilePic: ride.driver.profilePic,
        }
      : null,

    vehicle: ride.vehicle
      ? {
          id: ride.vehicle.id,
          vehicleNumber: ride.vehicle.vehicleNumber,
          vehicleType: ride.vehicle.vehicleType,
          brand: ride.vehicle.brand,
          model: ride.vehicle.model,
          color: ride.vehicle.color,
        }
      : null,

    pickup: {
      latitude: ride.pickupLat,
      longitude: ride.pickupLng,
      address: ride.pickupAddress,
    },

    destination: {
      latitude: ride.destinationLat,
      longitude: ride.destinationLng,
      address: ride.destinationAddress,
    },

    distanceKm: ride.distanceKm,
    durationMinutes: ride.durationMinutes,

    estimatedFare: ride.estimatedFare,
    finalFare: ride.finalFare,

    status: ride.status,

    requestedAt: ride.requestedAt,
    acceptedAt: ride.acceptedAt,
    arrivedAt: ride.arrivedAt,
    startedAt: ride.startedAt,
    completedAt: ride.completedAt,
    cancelledAt: ride.cancelledAt,

    createdAt: ride.createdAt,
    updatedAt: ride.updatedAt,
  }
}

const rideListModel = (rides = []) => {
  return rides.map((ride) => rideModel(ride))
}

module.exports = {
  rideModel,
  rideListModel,
}