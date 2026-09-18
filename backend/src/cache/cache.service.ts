// src/cache/cache.service.ts
// Thin wrapper around config/redis.ts's client for the common
// get-JSON/set-JSON-with-TTL pattern used repeatedly across routes, so
// callers don't have to JSON.parse/stringify by hand every time.

import { redis, cacheDelPattern } from "../config/redis";

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    const raw = await redis.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  async delPattern(pattern: string): Promise<number> {
    return cacheDelPattern(pattern);
  },
};