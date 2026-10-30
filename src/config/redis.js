import { createClient } from "redis";
import "dotenv/config";

const DEFAULT_TTL_SECONDS = 15 * 60;
const url = process.env.REDIS_URL;

let client = null;
let initialization = null;

const initializeClient = async () => {
  if (client?.isReady) return true;
  if (initialization) return initialization;

  if (!url) {
    console.warn("REDIS_URL is not configured");
    return false;
  }

  const redisClient = createClient({
    url,
    socket: {
      connectTimeout: 10000,
      reconnectStrategy: (retries) => {
        if (retries > 5) {
          return new Error("Redis reconnect limit reached");
        }
        return Math.min(500 * 2 ** retries, 5000);
      },
    },
  });

  redisClient.on("error", (err) => {
    console.error("Redis client error:", err.message);
  });

  redisClient.on("connect", () => {
    console.log("Redis socket connected");
  });

  redisClient.on("ready", () => {
    console.log("Redis ready");
  });

  redisClient.on("end", () => {
    console.warn("Redis connection ended");

    if (client === redisClient) {
      client = null;
    }
  });

  initialization = (async () => {
    try {
      await redisClient.connect();
      client = redisClient;
      return true;
    } catch (err) {
      console.error("Redis connection failed:", err.message);

      if (redisClient.isOpen) {
        redisClient.destroy();
      }

      return false;
    } finally {
      initialization = null;
    }
  })();

  return initialization;
};

const ensureInit = async () => {
  if (!client?.isReady) {
    const connected = await initializeClient();

    if (!connected) {
      throw new Error("Redis is unavailable");
    }
  }
};

const serialize = (value) =>
  typeof value === "string" ? value : JSON.stringify(value);

const deserialize = (raw) => {
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

const set = async (key, value, ttlSeconds = DEFAULT_TTL_SECONDS) => {
  await ensureInit();
  await client.set(key, serialize(value), { EX: ttlSeconds });
  return true;
};

const get = async (key) => {
  await ensureInit();
  return deserialize(await client.get(key));
};

const del = async (key) => {
  await ensureInit();
  await client.del(key);
  return true;
};

const exists = async (key) => {
  await ensureInit();
  return (await client.exists(key)) === 1;
};

const ttl = async (key) => {
  await ensureInit();
  return client.ttl(key);
};

const expire = async (key, ttlSeconds) => {
  await ensureInit();
  return client.expire(key, ttlSeconds);
};

const extend = async (key, ttlSeconds = DEFAULT_TTL_SECONDS) => {
  await ensureInit();

  if ((await client.exists(key)) === 1) {
    await client.expire(key, ttlSeconds);
    return true;
  }

  return false;
};

const refresh = async (key, ttlSeconds = DEFAULT_TTL_SECONDS) => {
  await ensureInit();

  const exists = await client.exists(key);

  if (exists) {
    await client.expire(key, ttlSeconds);
  } else {
    await client.set(key, "", { EX: ttlSeconds });
  }

  return true;
};

const setIfNotExists = async (key, value, ttlSeconds = DEFAULT_TTL_SECONDS) => {
  await ensureInit();

  const result = await client.set(key, serialize(value), {
    EX: ttlSeconds,
    NX: true,
  });

  return result === "OK";
};

const redisService = {
  set,
  get,
  del,
  exists,
  ttl,
  expire,
  extend,
  refresh,
  setIfNotExists,

  get client() {
    return client;
  },

  init: initializeClient,
  isAvailable: () => client?.isReady === true,
};

export default redisService;
