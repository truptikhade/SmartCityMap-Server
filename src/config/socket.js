import { createAdapter } from "@socket.io/redis-adapter";
import jwt from "jsonwebtoken";

import prisma from "../config/prisma.js";
import redis from "./redis.js";

let io = null;
let initialization = null;

let pubClient = null;
let subClient = null;

const lastLocationEmitAt = new Map();
const LOCATION_THROTTLE_MS = 2000;

/**
 * Initialize Redis adapter for Socket.IO.
 * Uses the default Socket.IO adapter if Redis is unavailable.
 */
const initializeRedisAdapter = async (socketServer) => {
  try {
    await redis.init();

    if (!redis.isAvailable()) {
      console.warn("Redis unavailable. Using default Socket.IO adapter.");
      return;
    }

    pubClient = redis.client.duplicate();
    subClient = redis.client.duplicate();

    pubClient.on("error", (err) => {
      console.error("Redis publisher error:", err.message);
    });

    subClient.on("error", (err) => {
      console.error("Redis subscriber error:", err.message);
    });

    await Promise.all([pubClient.connect(), subClient.connect()]);

    socketServer.adapter(createAdapter(pubClient, subClient));

    console.log("Socket.IO Redis adapter connected");
  } catch (error) {
    console.error(
      "Socket.IO Redis adapter initialization failed:",
      error.message,
    );

    // Clean up partially initialized connections.
    for (const client of [pubClient, subClient]) {
      if (client?.isOpen) {
        try {
          client.destroy();
        } catch (cleanupError) {
          console.error("Redis cleanup error:", cleanupError.message);
        }
      }
    }

    pubClient = null;
    subClient = null;

    console.warn("Continuing with default Socket.IO adapter.");
  }
};

/**
 * Initialize Socket.IO Server with Redis Adapter,
 * JWT Authentication, and Event Handlers.
 */
const initSocket = async (socketServer) => {
  if (io === socketServer) {
    return io;
  }

  if (initialization) {
    return initialization;
  }

  initialization = (async () => {
    io = socketServer;

    // Initialize Redis adapter.
    await initializeRedisAdapter(io);

    // JWT Authentication Middleware.
    io.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.split(" ")[1];

        if (!token) {
          return next(new Error("Authentication required"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded?.id) {
          return next(new Error("Invalid authentication token"));
        }

        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        });

        if (!user) {
          return next(new Error("User account not found"));
        }

        if (!user.isActive) {
          return next(new Error("Your account is deactivated"));
        }

        socket.userId = user.id;
        socket.role = user.role;
        socket.user = user;

        next();
      } catch (error) {
        console.error("Socket authentication error:", error.message);

        next(new Error("Invalid or expired token"));
      }
    });

    // Socket connection event handlers.
    io.on("connection", (socket) => {
      console.log(
        `Socket connected: ${socket.id} ` +
          `(user: ${socket.userId}, role: ${socket.role})`,
      );

      // Booking room management.
      socket.on("booking:join", async (bookingId) => {
        if (typeof bookingId !== "string" || !bookingId) {
          return;
        }

        try {
          const booking = await prisma.booking.findFirst({
            where: {
              id: bookingId,
              userId: socket.userId,
            },
            select: { id: true },
          });

          if (booking) {
            socket.join(`booking:${bookingId}`);
          }
        } catch (error) {
          console.error("Booking room authorization failed:", error.message);
        }
      });

      socket.on("booking:leave", (bookingId) => {
        if (bookingId) {
          socket.leave(`booking:${bookingId}`);
        }
      });

      // Transit route room management.
      socket.on("route:join", (routeId) => {
        if (routeId) {
          socket.join(`route:${routeId}`);
        }
      });

      socket.on("route:leave", (routeId) => {
        if (routeId) {
          socket.leave(`route:${routeId}`);
        }
      });

      // Vehicle location broadcasting.
      socket.on(
        "vehicle:location",
        ({ routeId, vehicleNumber, lat, lng } = {}) => {
          if (
            socket.role !== "driver" ||
            !routeId ||
            typeof lat !== "number" ||
            typeof lng !== "number" ||
            !Number.isFinite(lat) ||
            !Number.isFinite(lng) ||
            lat < -90 ||
            lat > 90 ||
            lng < -180 ||
            lng > 180
          ) {
            return;
          }

          const now = Date.now();

          const lastEmitAt = lastLocationEmitAt.get(socket.id) || 0;

          if (now - lastEmitAt < LOCATION_THROTTLE_MS) {
            return;
          }

          lastLocationEmitAt.set(socket.id, now);

          socket.to(`route:${routeId}`).emit("vehicle:location", {
            routeId,
            vehicleNumber,
            lat,
            lng,
            updatedAt: new Date(),
          });
        },
      );

      socket.on("disconnect", (reason) => {
        lastLocationEmitAt.delete(socket.id);

        console.log(`Socket disconnected: ${socket.id} (${reason})`);
      });
    });

    console.log("Socket.IO initialized successfully");

    return io;
  })();

  try {
    return await initialization;
  } finally {
    initialization = null;
  }
};

/**
 * Access active Socket.IO instance.
 */
const getIO = () => {
  if (!io) {
    throw new Error(
      "Socket.io not initialized. Call initSocket(server) first.",
    );
  }

  return io;
};

export default {
  initSocket,
  getIO,
};
