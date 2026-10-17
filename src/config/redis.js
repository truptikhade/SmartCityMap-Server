import redis from "redis";
import "dotenv/config"

// Redis client with key expiration / keep-alive management
//
// Redis is optional. If REDIS_URL is unavailable, the application
// keeps working — connection errors are logged but not fatal.
//
// Key expiration policy:
//   * Every set key gets an automatic TTL (default 15 min) so
//     stale data never lingers.
//   * Keys still "in use" get refreshed with refresh()/extend()
//     so they keep working while needed (sliding TTL).
//
// Environment:
//   REDIS_URL - Redis connection URL (default: redis://localhost:6379)

const DEFAULT_TTL_SECONDS = 15 * 60; // 15 minutes
const url = process.env.REDIS_URL || "redis://localhost:6379";

let client = null;
let initialized = false;

// Initialize client

const initializeClient = async () => {
  const _client = redis.createClient({
    url,
    socket: { connectTimeout: 10000 },
  });

  _client.on("error", (err) => {
    console.error("Redis client error:", err.message);
  });

  _client.on("end", () => {
    console.log("Redis connection closed");
  });

  _client.on("connect", () => {
    console.log("Redis connected");
  });

  try {
    await _client.connect();
    client = _client;
    initialized = true;
    return true;
  } catch (err) {
    console.error("Redis connection failed:", err.message);
    initialized = false;
    return false;
  }
};

// Helper functions (closures over the Redis client)

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

const ensureInit = async () => {
  if (!initialized) {
    await initializeClient();
  }
  return true;
};

const set = async (key, value, ttlSeconds = DEFAULT_TTL_SECONDS) => {
  // Set with expiration — key auto-deletes after ttlSeconds.
  await ensureInit();
  await client.set(key, serialize(value), { EX: ttlSeconds });
  return true;
};

const get = async (key) => {
  // Returns null if key missing/expired.
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
  return await client.ttl(key);
};

const expire = async (key, ttlSeconds) => {
  // Set/overwrite expiration on an existing key.
  await ensureInit();
  await client.expire(key, ttlSeconds);
  return true;
};

const extend = async (key, ttlSeconds = DEFAULT_TTL_SECONDS) => {
  // Extend expiration only if the key exists.
  await ensureInit();
  if ((await client.exists(key)) === 1) {
    await client.expire(key, ttlSeconds);
    return true;
  }
  return false;
};

const refresh = async (key, ttlSeconds = DEFAULT_TTL_SECONDS) => {
  // Keep-alive: refresh TTL if exists, else create with TTL.
  // Use this on every access for keys that must stay "working"
  // for as long as they are being used.
  await ensureInit();
  const alreadyExists = (await client.exists(key)) === 1;
  if (alreadyExists) {
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

// Export

const redisSerivce= {
  // High-level helpers
  set,
  get,
  del,
  exists,
  ttl,
  expire,
  extend,
  refresh,
  setIfNotExists,

  // Raw client (useful for advanced operations)
  get client() {
    return client;
  },

  // Initialization API
  init: initializeClient,
  isAvailable: () => !!client,
};

await initializeClient();

export default redisSerivce;