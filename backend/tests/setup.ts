// tests/setup.ts
//
// Runs once before the test suite (see jest.config.js setupFiles). Sets
// the env vars env.ts requires so importing app code in tests doesn't
// exit(1) on missing config, and points MONGO_URI at a distinct test DB
// name so tests never touch dev/prod data if a real Mongo happens to be
// reachable at that host.

process.env.NODE_ENV = "test";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/nityasamagri_test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret_at_least_32_characters_long";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test_refresh_secret_at_least_32_characters";
process.env.REDIS_HOST = process.env.REDIS_HOST || "localhost";
process.env.REDIS_PORT = process.env.REDIS_PORT || "6379";
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "test-project";
process.env.FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || "test@test-project.iam.gserviceaccount.com";
process.env.FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY || "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n";

// razorpayService is a module-level singleton (see razorpay.service.ts)
// whose constructor throws if these are missing — and it gets pulled in
// transitively by every test that imports app.ts (via payment.routes.ts /
// integrations.routes.ts), even tests that never touch payments. Without
// these, the whole test file fails at import time, not at the specific
// assertion that needed Razorpay.
process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_fake_key_id";
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "fake_test_secret";