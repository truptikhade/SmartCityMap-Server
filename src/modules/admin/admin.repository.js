const prisma = require('../../config/prisma')

// --------------------------------------------------
// FIND ALL DRIVERS
// --------------------------------------------------

const findAllDrivers = async () => {
  return prisma.driverProfile.findMany({
    include: {
      user: {
        select: {
          id: true,
          fname: true,
          lname: true,
          email: true,
          phone: true,
          role: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
        },
      },

      vehicles: {
        select: {
          id: true,
          vehicleNumber: true,
          vehicleType: true,
          brand: true,
          model: true,
          color: true,
          isActive: true,
          approvalStatus: true,
        },
      },
    },

    orderBy: {
      createdAt: 'desc',
    },
  })
}

// --------------------------------------------------
// FIND DRIVER BY ID
// --------------------------------------------------

const findDriverById = async (driverId) => {
  return prisma.driverProfile.findUnique({
    where: {
      id: driverId,
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
          isVerified: true,
          isActive: true,
          createdAt: true,
        },
      },

      vehicles: {
        select: {
          id: true,
          vehicleNumber: true,
          vehicleType: true,
          brand: true,
          model: true,
          color: true,
          isActive: true,
          approvalStatus: true,
        },
      },
    },
  })
}

// --------------------------------------------------
// APPROVE DRIVER
// --------------------------------------------------

const approveDriver = async (driverId) => {
  return prisma.driverProfile.update({
    where: {
      id: driverId,
    },

    data: {
      isApproved: true,
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

      vehicles: true,
    },
  })
}

// --------------------------------------------------
// REJECT DRIVER
// --------------------------------------------------

const rejectDriver = async (driverId) => {
  return prisma.driverProfile.update({
    where: {
      id: driverId,
    },

    data: {
      isApproved: false,
      isAvailable: false,
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

      vehicles: true,
    },
  })
}

// --------------------------------------------------
// FIND PENDING VEHICLE CHANGE REQUESTS
// --------------------------------------------------

const findPendingVehicleChangeRequests = async () => {
  return prisma.vehicleChangeRequest.findMany({
    where: {
      status: 'PENDING',
    },

    include: {
      driver: {
        include: {
          user: {
            select: {
              id: true,
              fname: true,
              lname: true,
              email: true,
              phone: true,
              role: true,
            },
          },
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
          isActive: true,
        },
      },
    },

    orderBy: {
      requestedAt: 'asc',
    },
  })
}

// --------------------------------------------------
// FIND VEHICLE CHANGE REQUEST
// --------------------------------------------------

const findVehicleChangeRequestById = async (
  requestId
) => {
  return prisma.vehicleChangeRequest.findUnique({
    where: {
      id: requestId,
    },

    include: {
      driver: {
        include: {
          user: {
            select: {
              id: true,
              fname: true,
              lname: true,
              email: true,
              phone: true,
              role: true,
            },
          },
        },
      },

      vehicle: true,
    },
  })
}

// --------------------------------------------------
// APPROVE VEHICLE CHANGE REQUEST
// --------------------------------------------------

const approveVehicleChangeRequest = async (
  requestId
) => {
  return prisma.$transaction(async (tx) => {
    const request =
      await tx.vehicleChangeRequest.findUnique({
        where: {
          id: requestId,
        },

        include: {
          vehicle: true,
        },
      })

    if (!request) {
      return null
    }

    if (request.status !== 'PENDING') {
      throw new Error(
        'This vehicle change request has already been reviewed'
      )
    }

    // Make sure another vehicle does not already
    // use the requested vehicle number.
    const existingVehicle =
      await tx.vehicle.findUnique({
        where: {
          vehicleNumber: request.vehicleNumber,
        },
      })

    if (
      existingVehicle &&
      existingVehicle.id !== request.vehicleId
    ) {
      throw new Error(
        'The requested vehicle number is already registered'
      )
    }

    // Update the existing vehicle.
    const updatedVehicle =
      await tx.vehicle.update({
        where: {
          id: request.vehicleId,
        },

        data: {
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

          isActive: true,

          approvalStatus: 'APPROVED',

          approvedAt: new Date(),

          rejectedAt: null,

          requestedAt: null,
        },
      })

    // Mark request approved.
    const updatedRequest =
      await tx.vehicleChangeRequest.update({
        where: {
          id: requestId,
        },

        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
        },

        include: {
          driver: {
            include: {
              user: {
                select: {
                  id: true,
                  fname: true,
                  lname: true,
                  email: true,
                  phone: true,
                  role: true,
                },
              },
            },
          },

          vehicle: true,
        },
      })

    return {
      request: updatedRequest,
      vehicle: updatedVehicle,
    }
  })
}

// --------------------------------------------------
// REJECT VEHICLE CHANGE REQUEST
// --------------------------------------------------

const rejectVehicleChangeRequest = async (
  requestId
) => {
  return prisma.$transaction(async (tx) => {
    const request =
      await tx.vehicleChangeRequest.findUnique({
        where: {
          id: requestId,
        },
      })

    if (!request) {
      return null
    }

    if (request.status !== 'PENDING') {
      throw new Error(
        'This vehicle change request has already been reviewed'
      )
    }

    // IMPORTANT:
    // The actual vehicle is NOT modified.
    const updatedRequest =
      await tx.vehicleChangeRequest.update({
        where: {
          id: requestId,
        },

        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
        },

        include: {
          driver: {
            include: {
              user: {
                select: {
                  id: true,
                  fname: true,
                  lname: true,
                  email: true,
                  phone: true,
                  role: true,
                },
              },
            },
          },

          vehicle: true,
        },
      })

    return updatedRequest
  })
}

module.exports = {
  findAllDrivers,
  findDriverById,
  approveDriver,
  rejectDriver,

  findPendingVehicleChangeRequests,
  findVehicleChangeRequestById,
  approveVehicleChangeRequest,
  rejectVehicleChangeRequest,
}