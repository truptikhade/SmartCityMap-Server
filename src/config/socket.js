import redisAdapter from "@socket.io/redis-adapter";
const { createAdapter } = redisAdapter;

import jwt from "jsonwebtoken";

import prisma from "../config/prisma.js";

import redis from "./redis.js";

let io = null;

/**
 * Initialize Socket.IO Server with Redis Adapter, JWT Auth, and Event Handlers
 */
const initSocket = async (socketServer) => {
  io = socketServer;

  // Redis adapter for scaling across horizontal instances
  if (redis.isAvailable()) {
    const pubClient = redis.client.duplicate();
    const subClient = redis.client.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
  }

  // Socket Authentication Middleware
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
        select: { id: true, email: true, role: true, isActive: true },
      });

      if (!user) {
        return next(new Error("User account not found"));
      }

      if (!user.isActive) {
        return next(new Error("Your account is deactivated"));
      }

      // Attach context to socket instance
      socket.userId = user.id;
      socket.role = user.role;
      socket.user = user;
      next();
    } catch (error) {
      console.error("Socket authentication error:", error.message);
      return next(new Error("Invalid or expired token"));
    }
  });

  // Event Handlers
  io.on("connection", (socket) => {
    console.log(
      `Socket connected: ${socket.id} (user: ${socket.userId}, role: ${socket.role})`,
    );

    // Booking Room Management
    socket.on("booking:join", (bookingId) => {
      if (bookingId) socket.join(`booking:${bookingId}`);
    });

    socket.on("booking:leave", (bookingId) => {
      if (bookingId) socket.leave(`booking:${bookingId}`);
    });

    // Driver Location Broadcasting
    socket.on("driver:location", ({ bookingId, lat, lng } = {}) => {
      if (
        socket.role !== "driver" ||
        !bookingId ||
        lat === undefined ||
        lng === undefined
      ) {
        return;
      }

      socket.to(`booking:${bookingId}`).emit("driver:location", {
        bookingId,
        lat,
        lng,
        updatedAt: new Date(),
      });
    });

    // Transit Route Room Management
    socket.on("route:join", (routeId) => {
      if (routeId) socket.join(`route:${routeId}`);
    });

    socket.on("route:leave", (routeId) => {
      if (routeId) socket.leave(`route:${routeId}`);
    });

    // Vehicle Location Broadcasting
    socket.on(
      "vehicle:location",
      ({ routeId, vehicleNumber, lat, lng } = {}) => {
        if (
          socket.role !== "driver" ||
          !routeId ||
          lat === undefined ||
          lng === undefined
        ) {
          return;
        }

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
      console.log(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

/**
 * Access active Socket.IO instance anywhere in the application
 */
const getIO = () => {
  if (!io) {
    throw new Error(
      "Socket.io not initialized — call initSocket(server) first",
    );
  }
  return io;
};

export default {
  initSocket,
  getIO,
};
