const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const prisma = require('../config/prisma')

let io = null

// --------------------------------------------------
// Initialize Socket.IO
// --------------------------------------------------

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin:
        process.env.CLIENT_URL ||
        'http://localhost:3000',

      methods: [
        'GET',
        'POST',
      ],

      credentials: true,
    },
  })

  // ------------------------------------------------
  // Socket authentication
  // ------------------------------------------------

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(
          ' '
        )[1]

      if (!token) {
        return next(
          new Error(
            'Authentication required'
          )
        )
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      )

      if (!decoded?.id) {
        return next(
          new Error(
            'Invalid authentication token'
          )
        )
      }

      // ----------------------------------------------
      // Get current user from database
      // ----------------------------------------------

      const user =
        await prisma.user.findUnique({
          where: {
            id: decoded.id,
          },

          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        })

      if (!user) {
        return next(
          new Error(
            'User account not found'
          )
        )
      }

      if (!user.isActive) {
        return next(
          new Error(
            'Your account is deactivated'
          )
        )
      }

      // ----------------------------------------------
      // Store authenticated user information
      // ----------------------------------------------

      socket.userId = user.id
      socket.role = user.role
      socket.user = user

      next()
    } catch (error) {
      console.error(
        'Socket authentication error:',
        error.message
      )

      return next(
        new Error(
          'Invalid or expired token'
        )
      )
    }
  })

  // --------------------------------------------------
  // Socket connection
  // --------------------------------------------------

  io.on(
    'connection',
    (socket) => {
      console.log(
        `Socket connected: ${socket.id} ` +
        `(user ${socket.userId}, role ${socket.role})`
      )

      // ----------------------------------------------
      // Booking room
      // ----------------------------------------------

      socket.on(
        'booking:join',
        (bookingId) => {
          if (!bookingId) {
            return
          }

          socket.join(
            `booking:${bookingId}`
          )
        }
      )

      socket.on(
        'booking:leave',
        (bookingId) => {
          if (!bookingId) {
            return
          }

          socket.leave(
            `booking:${bookingId}`
          )
        }
      )

      // ----------------------------------------------
      // Driver live location
      // ----------------------------------------------

      socket.on(
        'driver:location',
        ({
          bookingId,
          lat,
          lng,
        } = {}) => {
          if (
            socket.role !== 'driver'
          ) {
            return
          }

          if (
            !bookingId ||
            lat === undefined ||
            lng === undefined
          ) {
            return
          }

          socket
            .to(
              `booking:${bookingId}`
            )
            .emit(
              'driver:location',
              {
                bookingId,
                lat,
                lng,
                updatedAt:
                  new Date(),
              }
            )
        }
      )

      // ----------------------------------------------
      // Transit route room
      // ----------------------------------------------

      socket.on(
        'route:join',
        (routeId) => {
          if (!routeId) {
            return
          }

          socket.join(
            `route:${routeId}`
          )
        }
      )

      socket.on(
        'route:leave',
        (routeId) => {
          if (!routeId) {
            return
          }

          socket.leave(
            `route:${routeId}`
          )
        }
      )

      // ----------------------------------------------
      // Vehicle location
      // ----------------------------------------------

      socket.on(
        'vehicle:location',
        ({
          routeId,
          vehicleNumber,
          lat,
          lng,
        } = {}) => {
          if (
            socket.role !== 'driver'
          ) {
            return
          }

          if (
            !routeId ||
            lat === undefined ||
            lng === undefined
          ) {
            return
          }

          socket
            .to(
              `route:${routeId}`
            )
            .emit(
              'vehicle:location',
              {
                routeId,
                vehicleNumber,
                lat,
                lng,
                updatedAt:
                  new Date(),
              }
            )
        }
      )

      // ----------------------------------------------
      // Disconnect
      // ----------------------------------------------

      socket.on(
        'disconnect',
        (reason) => {
          console.log(
            `Socket disconnected: ${socket.id} (${reason})`
          )
        }
      )
    }
  )

  return io
}

// --------------------------------------------------
// Get Socket.IO instance
// --------------------------------------------------

const getIO = () => {
  if (!io) {
    throw new Error(
      'Socket.io not initialized — call initSocket(server) first'
    )
  }

  return io
}

module.exports = {
  initSocket,
  getIO,
}
