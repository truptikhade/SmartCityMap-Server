const { Server } = require('socket.io')
const jwt         = require('jsonwebtoken')

let io = null

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin:      process.env.CLIENT_URL || '*',
      methods:     ['GET', 'POST'],
      credentials: true,
    },
  })

  // Auth middleware — every socket connection must carry a valid JWT
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token
        || socket.handshake.headers?.authorization?.split(' ')[1]

      if (!token) return next(new Error('Authentication required'))

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      socket.userId = decoded.id
      socket.role   = decoded.role
      next()
    } catch (err) {
      next(new Error('Invalid or expired token'))
    }
  })

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (user ${socket.userId})`)

    // Rider/driver joins a room scoped to a specific booking
    socket.on('booking:join', (bookingId) => {
      socket.join(`booking:${bookingId}`)
    })

    socket.on('booking:leave', (bookingId) => {
      socket.leave(`booking:${bookingId}`)
    })

    // Driver broadcasts live location to everyone in the booking room
    socket.on('driver:location', ({ bookingId, lat, lng }) => {
      if (socket.role !== 'driver') return
      socket.to(`booking:${bookingId}`).emit('driver:location', {
        bookingId, lat, lng, updatedAt: new Date(),
      })
    })

    // Vehicle joins a route room so all riders on that route get updates
    socket.on('route:join', (routeId) => {
      socket.join(`route:${routeId}`)
    })

    socket.on('route:leave', (routeId) => {
      socket.leave(`route:${routeId}`)
    })

    socket.on('vehicle:location', ({ routeId, vehicleNumber, lat, lng }) => {
      if (socket.role !== 'driver') return
      socket.to(`route:${routeId}`).emit('vehicle:location', {
        routeId, vehicleNumber, lat, lng, updatedAt: new Date(),
      })
    })

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`)
    })
  })

  return io
}

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized — call initSocket(server) first')
  return io
}



module.exports = { initSocket, getIO }