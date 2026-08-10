// src/config/redis.ts
// Redis client — used for caching, OTP storage, sessions, rate limiting

import Redis from "ioredis";
import { logger } from "../utils/logger";

export const redis = new Redis({
  host:     process.env.REDIS_HOST     || "localhost",
  port:     Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    logger.warn(`Redis reconnect attempt ${times}, retrying in ${delay}ms`);
    return delay;
  },
  maxRetriesPerRequest: 3,
  lazyConnect: false,
});

redis.on("connect", () => {
  logger.info("✅ Redis connected");
});

redis.on("ready", () => {
  logger.info("✅ Redis ready to accept commands");
});

redis.on("error", (err) => {
  logger.error("❌ Redis error:", err.message);
});

redis.on("close", () => {
  logger.warn("⚠️  Redis connection closed");
});

redis.on("reconnecting", (delay: number) => {
  logger.info(`🔄 Redis reconnecting in ${delay}ms`);
});

// ── Helper functions ──────────────────────────────────────────────────────────

/** Set a value with expiry in seconds */
export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
}

/** Get and parse a cached value */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  return data ? (JSON.parse(data) as T) : null;
}

/** Delete a cache key */
export async function cacheDel(key: string): Promise<void> {
  await redis.del(key);
}

/**
 * Delete all keys matching a pattern (e.g. "products:list:*").
 *
 * Uses SCAN rather than KEYS: KEYS is O(N) over the *entire* keyspace and
 * blocks the single-threaded Redis event loop for the whole scan — fine on
 * a handful of keys, a real problem once the cache has meaningful volume.
 * SCAN walks the keyspace incrementally via a cursor, touching a small
 * bounded number of keys per call, so it never blocks other clients.
 */
export async function cacheDelPattern(pattern: string): Promise<void> {
  const matched: string[] = [];
  let cursor = "0";

  do {
    const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
    cursor = nextCursor;
    matched.push(...keys);
  } while (cursor !== "0");

  if (matched.length === 0) return;

  // Delete in batches rather than one DEL with a potentially huge arg list.
  const BATCH_SIZE = 500;
  for (let i = 0; i < matched.length; i += BATCH_SIZE) {
    await redis.del(...matched.slice(i, i + BATCH_SIZE));
  }
}

/** Increment a counter with optional expiry (used for rate limiting) */
export async function incrWithExpiry(key: string, ttlSeconds: number): Promise<number> {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, ttlSeconds);
  }
  return count;
}

// Graceful shutdown
process.on("beforeExit", async () => {
  await redis.quit();
});

export default redis;