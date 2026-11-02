import { Emitter } from "@socket.io/redis-emitter";
import { createClient } from "redis";

let emitterPromise = null;

const getEmitter = () => {
  if (!emitterPromise) {
    emitterPromise = (async () => {
      const client = createClient({ url: process.env.REDIS_URL });

      client.on("error", (err) => {
        console.error("Realtime emitter error:", err.message);
      });

      await client.connect();
      return new Emitter(client);
    })().catch((err) => {
      // Allow a retry on the next call instead of caching the failure.
      emitterPromise = null;
      throw err;
    });
  }

  return emitterPromise;
};

export const emitToRoom = async (room, event, payload) => {
  const emitter = await getEmitter();
  emitter.to(room).emit(event, payload);
};
