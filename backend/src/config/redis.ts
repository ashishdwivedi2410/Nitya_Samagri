// src/config/redis.ts
//
// ioredis client + a couple of small helpers used across the route files
// (e.g. product.routes.ts imports { redis, cacheDelPattern } from here).
// Was empty; ioredis was already in package.json/mocked in tests
// (tests/mocks/ioredis.mock.ts) so this just wires up the real client.

import Redis from "ioredis";
import { env } from "./env";
import { logger } from "../utils/logger";

export const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  lazyConnect: false,
});

redis.on("connect", () => logger.info("Redis connected"));
redis.on("error", (err) => logger.error("Redis error", { err }));

/**
 * Delete every key matching a glob pattern (e.g. "products:list:*").
 * Uses SCAN instead of KEYS so it doesn't block Redis on large keyspaces.
 */
export async function cacheDelPattern(pattern: string): Promise<number> {
  let cursor = "0";
  let deleted = 0;
  do {
    const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
    cursor = nextCursor;
    if (keys.length > 0) {
      deleted += await redis.del(...keys);
    }
  } while (cursor !== "0");
  return deleted;
}