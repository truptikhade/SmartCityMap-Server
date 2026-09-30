const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const http = require('http')
const { Server } = require('socket.io')

require('dotenv').config()

// ── Import Prisma ──────────────────────────────────────────
require('./src/config/prisma')

// ── Import Routes ──────────────────────────────────────────
const authRoutes = require('./src/modules/auth/auth.router')
const placesRoutes = require('./src/modules/places/places.router')
const transitRoutes = require('./src/modules/transit/transit.router')
const bookingRoutes = require('./src/modules/booking/booking.router')
const paymentRoutes = require('./src/modules/payment/payment.router')
const aiRoutes = require('./src/modules/ai/ai.router')
const driverRoutes = require('./src/modules/driver/driver.router')
const adminRoutes = require('./src/modules/admin/admin.router')
const rideRoutes = require('./src/modules/ride/ride.router')

// ── Import Middleware ──────────────────────────────────────
const errorHandler = require('./src/middleware/error.middleware')

// ── Import Socket ──────────────────────────────────────────
const { initSocket } = require('./src/config/socket')
const initTrackingSocket = require('./src/sockets/tracking.socket')
const {
  initRideSocket,
} = require('./src/sockets/ride.socket')

// ── Rate Limiting ──────────────────────────────────────────
const {
  globalLimiter,
  apiLimiter,
} = require('./src/middleware/rateLimit.middleware')

// ── Create App & Server ────────────────────────────────────
const app = express()

app.set('trust proxy', 1)

const server = http.createServer(app)

// ── CORS Configuration ─────────────────────────────────────

const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://smart-city-map-client-six.vercel.app',
].filter(Boolean)

const isAllowedOrigin = (origin) => {
  // Allow requests without an Origin header
  // Example: server-to-server requests, health checks, etc.
  if (!origin) {
    return true
  }

  // Allow explicitly configured origins
  if (allowedOrigins.includes(origin)) {
    return true
  }

  // Allow Vercel preview deployments
  if (
    /^https:\/\/smart-city-map-client-[a-z0-9-]+\.vercel\.app$/.test(
      origin
    )
  ) {
    return true
  }

  return false
}

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true)
    }

    console.log('❌ CORS blocked origin:', origin)

    return callback(
      new Error(`Origin ${origin} is not allowed by CORS`)
    )
  },

  credentials: true,

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
  ],
}

// ── Socket.io Setup ────────────────────────────────────────

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true)
      }

      console.log(
        '❌ Socket.IO CORS blocked origin:',
        origin
      )

      return callback(
        new Error(`Origin ${origin} is not allowed`)
      )
    },

    methods: ['GET', 'POST'],

    credentials: true,
  },
})

// Attach io to app so controllers can access it if needed
app.set('io', io)
global.io = io

// ── Initialize Sockets ─────────────────────────────────────

initSocket(io)
initTrackingSocket(io)
initRideSocket(io)

// ── Auto-start Transit Simulators ──────────────────────────

const autoStartSimulators = async (io) => {
  try {
    const repo = require('./src/modules/transit/transit.repository')
    const prisma = require('./src/config/prisma')
    const { startTripSimulator } = require('./src/sockets/trip.simulator')

    const today = new Date()

    today.setUTCHours(0, 0, 0, 0)

    const endOfDay = new Date()

    endOfDay.setUTCHours(23, 59, 59, 999)

    const trips = await prisma.trip.findMany({
      where: {
        travelDate: {
          gte: today,
          lte: endOfDay,
        },

        status: {
          in: ['scheduled', 'running'],
        },
      },
    })

    for (const trip of trips) {
      const stops = await repo.findStopsByRoute(
        trip.routeId
      )

      startTripSimulator(io, {
        tripId: trip.id,
        routeId: trip.routeId,
        stops,
        vehicleNumber: trip.vehicleNumber,
      })
    }

    console.log(
      `Auto-started ${trips.length} trip simulator(s)`
    )
  } catch (err) {
    console.error(
      'Auto-start simulator error:',
      err.message
    )
  }
}

// ── Global Middleware ──────────────────────────────────────

app.use(helmet())

app.use(cors(corsOptions))

app.use(morgan('dev'))

app.use(express.json())

app.use(
  express.urlencoded({
    extended: true,
  })
)

// ── Rate Limiting ──────────────────────────────────────────

app.use(globalLimiter)

app.use('/api', apiLimiter)

// ── Health Check ───────────────────────────────────────────

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SmartCity API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: 'smartcitymap_db',

    schemas: [
      'auth',
      'geo',
      'transit',
      'booking',
      'public',
    ],
  })
})

// ── API Routes ─────────────────────────────────────────────

app.use('/api/auth', authRoutes)

app.use('/api/places', placesRoutes)

app.use('/api/transit', transitRoutes)

app.use('/api/booking', bookingRoutes)

app.use('/api/payment', paymentRoutes)

app.use('/api/ai', aiRoutes)

app.use('/api/admin', adminRoutes)

// Driver routes
app.use('/api/driver', driverRoutes)

app.use('/api/rides', rideRoutes)

// ── 404 Handler ────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  })
})

// ── Global Error Handler ───────────────────────────────────

app.use(errorHandler)

// ── Start Server ───────────────────────────────────────────

const PORT = process.env.PORT || 9000

server.listen(PORT, async () => {
  console.log('')

  console.log(
    ' ──────────────────────────────────────────'
  )

  console.log(
    `SmartCity API running on port ${PORT}`
  )

  console.log(
    `http://localhost:${PORT}`
  )

  console.log(
    `http://localhost:${PORT}/health`
  )

  console.log(
    ' ──────────────────────────────────────────'
  )

  console.log('')

  // Auto-start simulators for today's trips
  await autoStartSimulators(io)
})

// ── Graceful Shutdown ──────────────────────────────────────

const prisma = require('./src/config/prisma')

process.on('SIGINT', async () => {
  console.log(
    '\nShutting down gracefully...'
  )

  await prisma.$disconnect()

  server.close(() => {
    console.log('Server closed')

    process.exit(0)
  })
})

process.on('SIGTERM', async () => {
  console.log(
    '\nSIGTERM received...'
  )

  await prisma.$disconnect()

  server.close(() => {
    console.log('Server closed')

    process.exit(0)
  })
})

// ── Export ─────────────────────────────────────────────────

module.exports = {
  app,
  io,
}