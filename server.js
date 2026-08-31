const express    = require('express')
const cors       = require('cors')     
const helmet     = require('helmet')
const morgan     = require('morgan')
const http       = require('http')
const { Server } = require('socket.io')
require('dotenv').config()

// ── Import Prisma (connects on startup) ───────────────────
require('./src/config/prisma')

// ── Import Routes ─────────────────────────────────────────
const authRoutes    = require('./src/modules/auth/auth.router')
const placesRoutes  = require('./src/modules/places/places.router')
const transitRoutes = require('./src/modules/transit/transit.router')
const bookingRoutes = require('./src/modules/booking/booking.router')
const paymentRoutes = require('./src/modules/payment/payment.router')

// ── Import Middleware ──────────────────────────────────────
const errorHandler = require('./src/middleware/error.middleware')

// ── Import Socket ──────────────────────────────────────────
const { initSocket }     = require('./src/config/socket') 
const initTrackingSocket = require('./src/sockets/tracking.socket')

// ── Create App & Server ───────────────────────────────────
const app    = express()
const server = http.createServer(app)

// ── Socket.io Setup ───────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin:  process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

// Attach io to app so controllers can access it if needed
app.set('io', io)

// Init tracking socket
initSocket(io)  
initTrackingSocket(io)
const autoStartSimulators = async (io) => {
  try {
    const repo   = require('./src/modules/transit/transit.repository')
    const prisma = require('./src/config/prisma')
    const { startTripSimulator } = require('./src/sockets/trip.simulator')

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const endOfDay = new Date()
    endOfDay.setUTCHours(23, 59, 59, 999)

    const trips = await prisma.trip.findMany({
      where: {
        travelDate: { gte: today, lte: endOfDay },
        status:     { in: ['scheduled', 'running'] },
      },
    })

    for (const trip of trips) {
      const stops = await repo.findStopsByRoute(trip.routeId)
      startTripSimulator(io, {
        tripId:        trip.id,
        routeId:       trip.routeId,
        stops,
        vehicleNumber: trip.vehicleNumber,
      })
    }

    console.log(`🚌 Auto-started ${trips.length} trip simulator(s)`)
  } catch (err) {
    console.error('Auto-start simulator error:', err.message)
  }
}

const {
  globalLimiter,
  apiLimiter,
} = require('./src/middleware/rateLimit.middleware')

// ── Global Middleware ──────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Rate Limiting ──────────────────────────────────────────
app.use(globalLimiter)          // ← applies to ALL routes
app.use('/api', apiLimiter)     // ← applies to all /api/* routes

// ── Health Check ──────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success:     true,
    message:     'SmartCity API is running',
    timestamp:   new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database:    'smartcitymap_db',
    schemas:     ['auth', 'geo', 'transit', 'booking', 'public'],
  })
})

// ── API Routes ────────────────────────────────────────────
app.use('/api/auth',    authRoutes)
app.use('/api/places',  placesRoutes)
app.use('/api/transit', transitRoutes)
app.use('/api/booking', bookingRoutes)
app.use('/api/payment', paymentRoutes)

// ── 404 Handler ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  })
})


// ── Global Error Handler (ALWAYS LAST) ────────────────────
app.use(errorHandler)

// ── Start Server ──────────────────────────────────────────
const PORT = process.env.PORT || 9000

server.listen(PORT, async () => {
  console.log('')
  console.log('🚀 ──────────────────────────────────────────')
  console.log(`🟢  SmartCity API running on port ${PORT}`)
  console.log(`🌍  http://localhost:${PORT}`)
  console.log(`🏥  http://localhost:${PORT}/health`)
  console.log('🚀 ──────────────────────────────────────────')
  console.log('')

  // Auto-start simulators for today's trips
  await autoStartSimulators(io)
})


// ── Graceful Shutdown ─────────────────────────────────────
const prisma = require('./src/config/prisma')

process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...')
  await prisma.$disconnect()
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGTERM', async () => {
  console.log('\nSIGTERM received...')
  await prisma.$disconnect()
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

module.exports = { app, io }