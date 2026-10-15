import express, { json, urlencoded } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";
import "dotenv/config";

// Prisma
import prisma from "./src/config/prisma.js";

// Routes
import authRoutes from "./src/modules/auth/auth.router.js";
import placesRoutes from "./src/modules/places/places.router.js";
import transitRoutes from "./src/modules/transit/transit.router.js";
import bookingRoutes from "./src/modules/booking/booking.router.js";
import paymentRoutes from "./src/modules/payment/payment.router.js";
import aiRoutes from "./src/modules/ai/ai.router.js";
import driverRoutes from "./src/modules/driver/driver.router.js";
import adminRoutes from "./src/modules/admin/admin.router.js";
import rideRoutes from "./src/modules/ride/ride.router.js";

// Middleware
import errorHandler from "./src/middleware/error.middleware.js";
import rateLimitMidl from "./src/middleware/rateLimit.middleware.js";
const { globalLimiter, apiLimiter } = rateLimitMidl;

// Socket configuration
import socketConfig from "./src/config/socket.js";
const { initSocket } = socketConfig;
import initTrackingSocket from "./src/sockets/tracking.socket.js";
import rideSocket from "./src/sockets/ride.socket.js";
const { initRideSocket } = rideSocket;
// Transit simulator dependencies
import tripSimulator from "./src/sockets/trip.simulator.js";
const { startTripSimulator } = tripSimulator;
// Create app and server
const app = express();
app.set("trust proxy", 1);

const server = createServer(app);

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://smart-city-map-client-six.vercel.app",
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  // Allow requests without an Origin header
  if (!origin) {
    return true;
  }

  // Allow configured origins
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Allow Vercel preview deployments
  if (
    /^https:\/\/smart-city-map-client-[a-z0-9-]+\.vercel\.app$/.test(origin)
  ) {
    return true;
  }

  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    console.log("CORS blocked origin:", origin);
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      console.log("Socket.IO CORS blocked origin:", origin);
      return callback(new Error(`Origin ${origin} is not allowed`));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make Socket.IO available to controllers
app.set("io", io);
globalThis.io = io;

// Initialize sockets
await initSocket(io);
initTrackingSocket(io);
initRideSocket(io);

// Automatically start today's transit simulators
const autoStartSimulators = async (io) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setUTCHours(23, 59, 59, 999);

    const trips = await prisma.trip.findMany({
      where: {
        travelDate: {
          gte: today,
          lte: endOfDay,
        },
        status: {
          in: ["scheduled", "running"],
        },
      },
    });

    for (const trip of trips) {
      const stops = await transitRepository.findStopsByRoute(trip.routeId);

      startTripSimulator(io, {
        tripId: trip.id,
        routeId: trip.routeId,
        stops,
        vehicleNumber: trip.vehicleNumber,
      });
    }

    console.log(`Auto-started ${trips.length} trip simulator(s)`);
  } catch (err) {
    console.error("Auto-start simulator error:", err.message);
  }
};

// Global middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(json());

app.use(
  urlencoded({
    extended: true,
  }),
);

// Rate limiting
app.use(globalLimiter);
app.use("/api", apiLimiter);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SmartCity API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: "smartcitymap_db",
    schemas: ["auth", "geo", "transit", "booking", "public"],
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/places", placesRoutes);
app.use("/api/transit", transitRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/rides", rideRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 9000;

server.listen(PORT, async () => {
  console.log("");
  console.log(`SmartCity API running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
  console.log(`http://localhost:${PORT}/health`);
  console.log("");

  await autoStartSimulators(io);
});

// Graceful shutdown
let isShuttingDown = false;

const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log("Server closed and Prisma disconnected");
      process.exit(0);
    } catch (err) {
      console.error("Shutdown error:", err);
      process.exit(1);
    }
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Export app and Socket.IO
export { app, io };
export default app;
