// tests/mocks/ioredis.mock.ts
//
// Manual mock for the `ioredis` package. jest.config.js redirects every
// `import Redis from "ioredis"` to this file via moduleNameMapper, so tests
// never open a real TCP connection to Redis.
//
// A single shared instance (`mockRedisInstance`) backs every `new Redis(...)`
// call in the app (src/config/redis.ts creates one at import time), so tests
// can prime or inspect it directly, e.g.
//   mockRedisInstance.get.mockResolvedValueOnce(JSON.stringify(cached));
//   expect(mockRedisInstance.setex).toHaveBeenCalledWith("key", 300, ...);
//
// jest.config.js also sets `clearMocks: true`, which resets each mock
// function's calls/return-values between tests automatically — no manual
// reset needed here.

export const mockRedisInstance = {
  get:    jest.fn().mockResolvedValue(null),
  set:    jest.fn().mockResolvedValue("OK"),
  setex:  jest.fn().mockResolvedValue("OK"),
  del:    jest.fn().mockResolvedValue(1),
  scan:   jest.fn().mockResolvedValue(["0", [] as string[]]),
  incr:   jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(1),
  ttl:    jest.fn().mockResolvedValue(-1),
  publish: jest.fn().mockResolvedValue(0),
  quit:   jest.fn().mockResolvedValue("OK"),
  on:     jest.fn().mockReturnThis(),
  // redis.duplicate() (used by the WebSocket server for a pub/sub
  // subscriber connection) returns another client — hand back the same
  // shared mock so tests only ever have one instance to reason about.
  duplicate: jest.fn(() => mockRedisInstance),
};

// `new Redis(config)` in src/config/redis.ts needs a constructable default
// export. A class constructor that explicitly returns an object makes `new`
// yield that object instead of a fresh instance, so every `new Redis(...)`
// anywhere in the app resolves to the same mockRedisInstance above.
class MockRedis {
  constructor(..._args: unknown[]) {
    return mockRedisInstance as unknown as MockRedis;
  }
}

export default MockRedis;