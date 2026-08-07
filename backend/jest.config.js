/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  setupFiles: ["<rootDir>/tests/setup.ts"],
  // Redirect the real ioredis client to an in-memory mock everywhere, so
  // tests never try to open a real TCP connection to Redis.
  moduleNameMapper: {
    "^ioredis$": "<rootDir>/tests/mocks/ioredis.mock.ts",
  },
  clearMocks: true,
  verbose: true,
  // Route files pull in Prisma/Redis/Razorpay clients as a side effect of
  // import, which can leave sockets/timers open — cap runtime so a hang
  // fails the job instead of stalling CI indefinitely.
  testTimeout: 15000,
  forceExit: true,
};