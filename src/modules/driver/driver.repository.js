const prisma = require('../../config/prisma')

// --------------------------------------------------
// FIND DRIVER BY USER ID
// --------------------------------------------------

const findDriverByUserId = async (userId) => {
  return prisma.driverProfile.findUnique({
    where: {
      userId,
    },

    include: {
      user: {
        select: {
          id: true,
          fname: true,
          lname: true,
          email: true,
          phone: true,
          role: true,
          profilePic: true,
          isActive: true,
          isVerified: true,
        },
      },

      vehicles: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })
}

// --------------------------------------------------
// UPDATE DRIVER PERSONAL DETAILS
// --------------------------------------------------

const updateDriverProfile = async ({
  userId,
  fname,
  lname,
  email,
  phone,
}) => {
  return prisma.user.update({
    where: {
      id: userId,
    },

    data: {
      ...(fname !== undefined && {
        fname,
      }),

      ...(lname !== undefined && {
        lname,
      }),

      ...(email !== undefined && {
        email,
      }),

      ...(phone !== undefined && {
        phone,
      }),
    },

    select: {
      id: true,
      fname: true,
      lname: true,
      email: true,
      phone: true,
      role: true,
      profilePic: true,
      isActive: true,
      isVerified: true,
    },
  })
}

// --------------------------------------------------
// UPDATE DRIVER AVAILABILITY
// --------------------------------------------------

const updateAvailability = async ({
  userId,
  isAvailable,
}) => {
  return prisma.driverProfile.update({
    where: {
      userId,
    },

    data: {
      isAvailable,
    },

    include: {
      user: {
        select: {
          id: true,
          fname: true,
          lname: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
        },
      },

      vehicles: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })
}

// --------------------------------------------------
// FIND DRIVER VEHICLES
// --------------------------------------------------

const findDriverVehicles = async (userId) => {
  return prisma.vehicle.findMany({
    where: {
      driver: {
        userId,
      },
    },

    orderBy: {
      createdAt: 'desc',
    },
  })
}

// --------------------------------------------------
// FIND ACTIVE APPROVED VEHICLE
// --------------------------------------------------

const findActiveDriverVehicle = async (userId) => {
  return prisma.vehicle.findFirst({
    where: {
      driver: {
        userId,
      },

      isActive: true,

      approvalStatus: 'APPROVED',
    },

    orderBy: {
      createdAt: 'desc',
    },
  })
}

// --------------------------------------------------
// CREATE VEHICLE CHANGE REQUEST
// --------------------------------------------------

const createVehicleChangeRequest = async ({
  userId,
  vehicleNumber,
  vehicleType,
  brand,
  model,
  color,
}) => {
  return prisma.$transaction(async (tx) => {
    const driver = await tx.driverProfile.findUnique({
      where: {
        userId,
      },
    })

    if (!driver) {
      throw new Error('Driver profile not found')
    }

    if (!driver.isApproved) {
      throw new Error(
        'Your driver account is not approved yet'
      )
    }

    // Find the currently active vehicle.
    const currentVehicle = await tx.vehicle.findFirst({
      where: {
        driverId: driver.id,
        isActive: true,
        approvalStatus: 'APPROVED',
      },

      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!currentVehicle) {
      throw new Error(
        'No active approved vehicle was found'
      )
    }

    // Only one pending vehicle change request at a time.
    const existingPending =
      await tx.vehicleChangeRequest.findFirst({
        where: {
          driverId: driver.id,
          status: 'PENDING',
        },
      })

    if (existingPending) {
      throw new Error(
        'You already have a vehicle change request pending approval'
      )
    }

    // Check whether the requested number belongs to
    // another vehicle.
    const existingVehicle =
      await tx.vehicle.findUnique({
        where: {
          vehicleNumber,
        },
      })

    if (
      existingVehicle &&
      existingVehicle.id !== currentVehicle.id
    ) {
      throw new Error(
        'Vehicle number is already registered with another vehicle'
      )
    }

    // Create a request instead of creating a new vehicle.
    return tx.vehicleChangeRequest.create({
      data: {
        driverId: driver.id,
        vehicleId: currentVehicle.id,

        vehicleNumber,
        vehicleType,
        brand: brand || null,
        model: model || null,
        color: color || null,

        status: 'PENDING',

        requestedAt: new Date(),
      },

      include: {
        vehicle: true,
      },
    })
  })
}

// --------------------------------------------------
// FIND DRIVER VEHICLE CHANGE REQUESTS
// --------------------------------------------------

const findVehicleChangeRequests = async (userId) => {
  return prisma.vehicleChangeRequest.findMany({
    where: {
      driver: {
        userId,
      },
    },

    include: {
      vehicle: true,
    },

    orderBy: {
      requestedAt: 'desc',
    },
  })
}

// --------------------------------------------------
// RIDE SUMMARY
// --------------------------------------------------

const getRideSummary = async (driverId) => {
  const [
    totalTrips,
    completedTrips,
    cancelledTrips,
    earnings,
  ] = await Promise.all([
    prisma.rideRequest.count({
      where: {
        driverId,
      },
    }),

    prisma.rideRequest.count({
      where: {
        driverId,
        status: 'COMPLETED',
      },
    }),

    prisma.rideRequest.count({
      where: {
        driverId,
        status: 'CANCELLED',
      },
    }),

    prisma.rideRequest.aggregate({
      where: {
        driverId,
        status: 'COMPLETED',
      },

      _sum: {
        finalFare: true,
      },
    }),
  ])

  return {
    totalTrips,
    completedTrips,
    cancelledTrips,

    totalEarnings: Number(
      earnings._sum.finalFare || 0
    ),
  }
}

// --------------------------------------------------
// PENDING RIDES
// --------------------------------------------------

const findPendingRideRequests = async ({
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

// --------------------------------------------------
// ACTIVE RIDE
// --------------------------------------------------

const findActiveRide = async (driverId) => {
  return prisma.rideRequest.findFirst({
    where: {
      driverId,

      status: {
        in: [
          'ACCEPTED',
          'DRIVER_ARRIVING',
          'DRIVER_ARRIVED',
          'OTP_VERIFIED',
          'IN_PROGRESS',
        ],
      },
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

      vehicle: true,
    },

    orderBy: {
      acceptedAt: 'desc',
    },
  })
}

// --------------------------------------------------
// RECENT RIDES
// --------------------------------------------------

const findRecentRides = async (
  driverId,
  limit = 10
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

      vehicle: true,
    },

    orderBy: {
      requestedAt: 'desc',
    },

    take: limit,
  })
}

module.exports = {
  findDriverByUserId,
  updateDriverProfile,
  updateAvailability,
  findDriverVehicles,
  findActiveDriverVehicle,
  createVehicleChangeRequest,
  findVehicleChangeRequests,
  getRideSummary,
  findPendingRideRequests,
  findActiveRide,
  findRecentRides,
}