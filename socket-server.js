import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import prisma from "./src/config/prisma.js";
import socketConfig from "./src/config/socket.js";
import rideSocket from "./src/sockets/ride.socket.js";
import { startDueTripSimulators } from "./src/sockets/trip.scheduler.js";
import { isAllowedOrigin } from "./src/config/origins.js";

const { initSocket } = socketConfig;
const { initRideSocket } = rideSocket;

const app = express();
app.get("/health", (req, res) => res.json({ ok: true }));

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) =>
      isAllowedOrigin(origin)
        ? callback(null, true)
        : callback(new Error(`Origin ${origin} is not allowed`)),
    methods: ["GET", "POST"],
    credentials: true,
  },
});

await initSocket(io);
initRideSocket(io);

const PORT = process.env.PORT || 9000;

server.listen(PORT, () => {
  console.log(`Socket server listening on ${PORT}`);
  startDueTripSimulators(io);
  const interval = setInterval(() => startDueTripSimulators(io), 15_000);
  interval.unref();
});

const shutdown = async (signal) => {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
