const prisma = require('../config/prisma')

// ─────────────────────────────────────────────────────────
// ROOMS
// ─────────────────────────────────────────────────────────

const getDriverRoom = (driverId) =>
  `driver:${driverId}`

const getVehicleTypeRoom = (vehicleType) =>
  `drivers:${vehicleType}`

const getPassengerRoom = (passengerId) =>
  `passenger:${passengerId}`

// ─────────────────────────────────────────────────────────
// INITIALIZE RIDE SOCKET
// ─────────────────────────────────────────────────────────

const initRideSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(
      `🔌 Ride socket connected: ${socket.id}`
    )

    // DRIVER ONLINE
    socket.on(
      'driver:online',
      async ({
        driverId,
        vehicleType,
      } = {}) => {
        try {
          if (
            !driverId ||
            !vehicleType
          ) {
            socket.emit(
              'ride:error',
              {
                message:
                  'driverId and vehicleType are required',
              }
            )

            return
          }

          const driver =
            await prisma.driverProfile.findUnique({
              where: {
                userId: driverId,
              },

              include: {
                user: {
                  select: {
                    id: true,
                    role: true,
                    isActive: true,
                  },
                },

                vehicles: {
                  where: {
                    vehicleType,
                    isActive: true,
                  },

                  select: {
                    id: true,
                    vehicleType: true,
                    vehicleNumber: true,
                  },
                },
              },
            })

          if (!driver) {
            socket.emit(
              'ride:error',
              {
                message:
                  'Driver profile not found',
              }
            )

            return
          }

          if (
            driver.user?.role !==
            'driver'
          ) {
            socket.emit(
              'ride:error',
              {
                message:
                  'User is not a driver',
              }
            )

            return
          }

          if (
            !driver.user.isActive
          ) {
            socket.emit(
              'ride:error',
              {
                message:
                  'Driver account is inactive',
              }
            )

            return
          }

          if (!driver.isApproved) {
            socket.emit(
              'ride:error',
              {
                message:
                  'Driver is not approved',
              }
            )

            return
          }

          if (
            driver.vehicles.length ===
            0
          ) {
            socket.emit(
              'ride:error',
              {
                message:
                  'No active vehicle found for this vehicle type',
              }
            )

            return
          }

          socket.join(
            getDriverRoom(driverId)
          )

          socket.join(
            getVehicleTypeRoom(
              vehicleType
            )
          )

          socket.data.driverId =
            driverId

          socket.data.vehicleType =
            vehicleType

          socket.data.isDriver =
            true

          socket.emit(
            'driver:online:success',
            {
              driverId,
              vehicleType,
              message:
                'Driver is online',
            }
          )

          console.log(
            `🚗 Driver ${driverId} online as ${vehicleType}`
          )
        } catch (error) {
          console.error(
            'Driver online socket error:',
            error.message
          )

          socket.emit(
            'ride:error',
            {
              message:
                'Unable to connect driver',
            }
          )
        }
      }
    )

    // PASSENGER JOIN
    socket.on(
      'passenger:join',
      ({ passengerId } = {}) => {
        if (!passengerId) {
          socket.emit(
            'ride:error',
            {
              message:
                'passengerId is required',
            }
          )

          return
        }

        socket.join(
          getPassengerRoom(
            passengerId
          )
        )

        socket.data.passengerId =
          passengerId

        socket.data.isPassenger =
          true

        socket.emit(
          'passenger:join:success',
          {
            passengerId,
          }
        )
      }
    )

    // DRIVER OFFLINE
    socket.on(
      'driver:offline',
      () => {
        const {
          driverId,
          vehicleType,
        } = socket.data || {}

        if (driverId) {
          socket.leave(
            getDriverRoom(
              driverId
            )
          )
        }

        if (vehicleType) {
          socket.leave(
            getVehicleTypeRoom(
              vehicleType
            )
          )
        }

        socket.data.isDriver =
          false

        socket.emit(
          'driver:offline:success',
          {
            message:
              'Driver is offline',
          }
        )
      }
    )

    // DISCONNECT
    socket.on(
      'disconnect',
      (reason) => {
        console.log(
          `🔌 Ride socket disconnected: ${socket.id} (${reason})`
        )
      }
    )
  })
}

// ─────────────────────────────────────────────────────────
// NEW RIDE REQUEST
// ─────────────────────────────────────────────────────────

const emitNewRideRequest = ({
  io,
  ride,
}) => {
  if (
    !io ||
    !ride ||
    !ride.vehicleType
  ) {
    return
  }

  io.to(
    getVehicleTypeRoom(
      ride.vehicleType
    )
  ).emit(
    'ride:new_request',
    {
      ride,
    }
  )

  console.log(
    `📢 New ${ride.vehicleType} ride request emitted`
  )
}

// ─────────────────────────────────────────────────────────
// RIDE UPDATED
// ─────────────────────────────────────────────────────────

const emitRideUpdate = ({
  io,
  ride,
}) => {
  if (!io || !ride) {
    return
  }

  // Notify assigned driver
  if (ride.driver?.id) {
    io.to(
      getDriverRoom(
        ride.driver.id
      )
    ).emit(
      'ride:updated',
      {
        ride,
      }
    )
  }

  // Notify passenger
  if (ride.passenger?.id) {
    io.to(
      getPassengerRoom(
        ride.passenger.id
      )
    ).emit(
      'ride:updated',
      {
        ride,
      }
    )
  }

  console.log(
    `📡 Ride update emitted: ${ride.id} → ${ride.status}`
  )
}

// ─────────────────────────────────────────────────────────
// DRIVER-SPECIFIC UPDATE
// ─────────────────────────────────────────────────────────

const emitRideUpdateToDriver = ({
  io,
  driverId,
  ride,
}) => {
  if (
    !io ||
    !driverId ||
    !ride
  ) {
    return
  }

  io.to(
    getDriverRoom(driverId)
  ).emit(
    'ride:updated',
    {
      ride,
    }
  )
}

module.exports = {
  initRideSocket,
  emitNewRideRequest,
  emitRideUpdate,
  emitRideUpdateToDriver,
  getDriverRoom,
  getVehicleTypeRoom,
  getPassengerRoom,
}