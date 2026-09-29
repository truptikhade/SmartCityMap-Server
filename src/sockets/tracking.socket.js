const jwt = require('jsonwebtoken')

// Simple in-memory throttle map: socket.id -> last emit timestamp
const lastEmitAt = new Map()
const THROTTLE_MS = 2000 // server-side floor: max 1 location update per driver per 2s

const initTrackingSocket = (io) => {
  // ── Auth middleware — every socket connection must carry a valid JWT ──
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

    // ── Booking-scoped rooms (rider <-> driver for one trip) ──────────
    socket.on('booking:join', (bookingId) => {
      socket.join(`booking:${bookingId}`)
    })

    socket.on('booking:leave', (bookingId) => {
      socket.leave(`booking:${bookingId}`)
    })

    socket.on('driver:location', ({ bookingId, lat, lng }) => {
      if (socket.role !== 'driver') return
      if (!bookingId || lat == null || lng == null) return

      // Server-side throttle — protects against a runaway/misbehaving client
      const now = Date.now()
      const last = lastEmitAt.get(socket.id) || 0
      if (now - last < THROTTLE_MS) return
      lastEmitAt.set(socket.id, now)

      socket.to(`booking:${bookingId}`).emit('driver:location', {
        bookingId, lat, lng, updatedAt: new Date(),
      })
    })

    // ── Route-scoped rooms (all riders watching a bus/shuttle route) ──
    socket.on('route:join', (routeId) => {
      socket.join(`route:${routeId}`)
    })

    socket.on('route:leave', (routeId) => {
      socket.leave(`route:${routeId}`)
    })

    socket.on('vehicle:location', ({ routeId, vehicleNumber, lat, lng }) => {
      if (socket.role !== 'driver') return
      if (!routeId || lat == null || lng == null) return

      const now = Date.now()
      const last = lastEmitAt.get(socket.id) || 0
      if (now - last < THROTTLE_MS) return
      lastEmitAt.set(socket.id, now)

      socket.to(`route:${routeId}`).emit('vehicle:location', {
        routeId, vehicleNumber, lat, lng, updatedAt: new Date(),
      })
    })

    socket.on('disconnect', () => {
      lastEmitAt.delete(socket.id)
      console.log(`Socket disconnected: ${socket.id}`)
    })
  })
}

module.exports = initTrackingSocket