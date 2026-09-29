const prisma = require('../../config/prisma')

// FIND AVAILABLE DRIVERS FOR VEHICLE TYPE
const findPassengerById = async (passengerId) => {
  return prisma.user.findFirst({
    where: {
      id: passengerId,
      role: 'user',
      isActive: true,
    },
    select: {
      id: true,
    },
  })
}

const findAvailableDrivers = async ({
  vehicleType,
}) => {
  return prisma.driverProfile.findMany({
    where: {
      isApproved: true,
      isAvailable: true,

      user: {
        isActive: true,
        role: 'driver',
      },

      vehicles: {
        some: {
          vehicleType,
          isActive: true,
        },
      },
    },

    include: {
      user: {
        select: {
          id: true,
          fname: true,
          lname: true,
          phone: true,
          profilePic: true,
        },
      },

      vehicles: {
        where: {
          vehicleType,
          isActive: true,
        },

        select: {
          id: true,
          vehicleNumber: true,
          vehicleType: true,
          brand: true,
          model: true,
          color: true,
        },
      },
    },

    orderBy: {
      createdAt: 'asc',
    },
  })
}

// FIND AVAILABLE DRIVER + VEHICLE

const findAvailableDriverVehicle = async ({
  driverId,
  vehicleId,
}) => {
  return prisma.driverProfile.findFirst({
    where: {
      isApproved: true,
      isAvailable: true,

      user: {
        id: driverId,
        isActive: true,
        role: 'driver',
      },

      vehicles: {
        some: {
          id: vehicleId,
          isActive: true,
        },
      },
    },

    include: {
      user: {
        select: {
          id: true,
          fname: true,
          lname: true,
          phone: true,
          profilePic: true,
        },
      },

      vehicles: {
        where: {
          id: vehicleId,
          isActive: true,
        },

        select: {
          id: true,
          vehicleNumber: true,
          vehicleType: true,
          brand: true,
          model: true,
          color: true,
        },
      },
    },
  })
}

// FIND DRIVER BY USER ID

const findDriverByUserId = async (
  driverId
) => {
  return prisma.driverProfile.findUnique({
    where: {
      userId: driverId,
    },

    include: {
      user: {
        select: {
          id: true,
          fname: true,
          lname: true,
          phone: true,
          profilePic: true,
          role: true,
          isActive: true,
        },
      },

      vehicles: {
        where: {
          isActive: true,
        },

        select: {
          id: true,
          vehicleNumber: true,
          vehicleType: true,
          brand: true,
          model: true,
          color: true,
          isActive: true,
        },
      },
    },
  })
}

// CREATE RIDE REQUEST

// CREATE RIDE REQUEST

const createRideRequest = async ({
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
}) => {
  return prisma.rideRequest.create({
    data: {
      passengerId,

      // Prisma field names
      pickupLatitude: Number(pickupLat),
      pickupLongitude: Number(pickupLng),
      pickupAddress,

      destinationLatitude: Number(
        destinationLat
      ),
      destinationLongitude: Number(
        destinationLng
      ),
      destinationAddress,

      distanceKm:
        distanceKm != null
          ? Number(distanceKm)
          : null,

      // Prisma schema expects Int
      durationMinutes:
        durationMinutes != null
          ? Math.round(
              Number(durationMinutes)
            )
          : null,

      estimatedFare: Number(
        estimatedFare ?? 0
      ),

      vehicleType,

      otpHash,

      status: 'REQUESTED',

      requestedAt: new Date(),
    },
  })
}

// FIND RIDE BY ID

const findRideById = async (
  rideId
) => {
  return prisma.rideRequest.findUnique({
    where: {
      id: rideId,
    },

    include: {
      passenger: {
        select: {
          id: true,
          fname: true,
          lname: true,
          email: true,
          phone: true,
          profilePic: true,
        },
      },

      driver: {
        select: {
          id: true,
          fname: true,
          lname: true,
          phone: true,
          profilePic: true,
        },
      },

      vehicle: {
        select: {
          id: true,
          vehicleNumber: true,
          vehicleType: true,
          brand: true,
          model: true,
          color: true,
        },
      },
    },
  })
}

// FIND PASSENGER RIDES

const findPassengerRides = async (
  passengerId
) => {
  return prisma.rideRequest.findMany({
    where: {
      passengerId,
    },

    include: {
      driver: {
        select: {
          id: true,
          fname: true,
          lname: true,
          phone: true,
          profilePic: true,
        },
      },

      vehicle: {
        select: {
          id: true,
          vehicleNumber: true,
          vehicleType: true,
          brand: true,
          model: true,
          color: true,
        },
      },
    },

    orderBy: {
      requestedAt: 'desc',
    },
  })
}

// FIND DRIVER RIDES

const findDriverRides = async (
  driverId
) => {
  return prisma.rideRequest.findMany({
    where: {
      driverId,
    },

    include: {
      passenger: {
        select: {
          id: true,
          fname: true,
          lname: true,
          phone: true,
          profilePic: true,
        },
      },

      vehicle: {
        select: {
          id: true,
          vehicleNumber: true,
          vehicleType: true,
          brand: true,
          model: true,
          color: true,
        },
      },
    },

    orderBy: {
      requestedAt: 'desc',
    },
  })
}

// FIND REQUESTED RIDES FOR VEHICLE TYPE

const findRequestedRides = async ({
  vehicleType,
}) => {
  return prisma.rideRequest.findMany({
    where: {
      status: 'REQUESTED',
      vehicleType,
    },

    include: {
      passenger: {
        select: {
          id: true,
          fname: true,
          lname: true,
          phone: true,
          profilePic: true,
        },
      },
    },

    orderBy: {
      requestedAt: 'asc',
    },
  })
}

// ASSIGN DRIVER

const assignDriver = async ({
  rideId,
  driverId,
  vehicleId,
}) => {
  return prisma.$transaction(
    async (tx) => {
      const ride =
        await tx.rideRequest.findUnique({
          where: {
            id: rideId,
          },
        })

      if (!ride) {
        throw new Error(
          'Ride not found'
        )
      }

      if (
        ride.status !== 'REQUESTED'
      ) {
        throw new Error(
          'Ride is no longer available'
        )
      }

      const driver =
        await tx.driverProfile.findFirst({
          where: {
            userId: driverId,

            isApproved: true,
            isAvailable: true,

            user: {
              isActive: true,
              role: 'driver',
            },

            vehicles: {
              some: {
                id: vehicleId,
                isActive: true,
                vehicleType:
                  ride.vehicleType,
              },
            },
          },

          include: {
            vehicles: {
              where: {
                id: vehicleId,
                isActive: true,
              },
            },
          },
        })

      if (!driver) {
        throw new Error(
          'Driver or vehicle is not available'
        )
      }

      return tx.rideRequest.update({
        where: {
          id: rideId,
        },

        data: {
          driverId,
          vehicleId,

          status: 'ACCEPTED',

          acceptedAt: new Date(),
        },

        include: {
          passenger: {
            select: {
              id: true,
              fname: true,
              lname: true,
              phone: true,
            },
          },

          driver: {
            select: {
              id: true,
              fname: true,
              lname: true,
              phone: true,
              profilePic: true,
            },
          },

          vehicle: {
            select: {
              id: true,
              vehicleNumber: true,
              vehicleType: true,
              brand: true,
              model: true,
              color: true,
            },
          },
        },
      })
    }
  )
}

// UPDATE RIDE STATUS

const updateRideStatus = async ({
  rideId,
  status,
  data = {},
}) => {
  return prisma.rideRequest.update({
    where: {
      id: rideId,
    },

    data: {
      status,
      ...data,
    },

    include: {
      passenger: {
        select: {
          id: true,
          fname: true,
          lname: true,
          phone: true,
          profilePic: true,
        },
      },

      driver: {
        select: {
          id: true,
          fname: true,
          lname: true,
          phone: true,
          profilePic: true,
        },
      },

      vehicle: {
        select: {
          id: true,
          vehicleNumber: true,
          vehicleType: true,
          brand: true,
          model: true,
          color: true,
        },
      },
    },
  })
}

// COMPLETE RIDE

const completeRide = async ({
  rideId,
  finalFare,
}) => {
  return prisma.rideRequest.update({
    where: {
      id: rideId,
    },

    data: {
      status: 'COMPLETED',
      finalFare,
      completedAt: new Date(),
    },

    include: {
      passenger: {
        select: {
          id: true,
          fname: true,
          lname: true,
          phone: true,
        },
      },

      driver: {
        select: {
          id: true,
          fname: true,
          lname: true,
          phone: true,
        },
      },

      vehicle: {
        select: {
          id: true,
          vehicleNumber: true,
          vehicleType: true,
          brand: true,
          model: true,
          color: true,
        },
      },
    },
  })
}

// CANCEL RIDE

const cancelRide = async ({
  rideId,
}) => {
  return prisma.rideRequest.update({
    where: {
      id: rideId,
    },

    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    },
  })
}

module.exports = {
  findPassengerById,
  findAvailableDrivers,
  findAvailableDriverVehicle,
  findDriverByUserId,
  createRideRequest,
  findRideById,
  findPassengerRides,
  findDriverRides,
  findRequestedRides,
  assignDriver,
  updateRideStatus,
  completeRide,
  cancelRide,
}