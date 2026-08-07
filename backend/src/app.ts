import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";

import { errorHandler } from "./middlewares/error.middleware";
import { notFound }     from "./middlewares/notFound.middleware";
import { logger }       from "./utils/logger";

// ── Routes ────────────────────────────────────────────────────────────────────
import authRoutes         from "./modules/auth/auth.routes";
import productRoutes      from "./modules/products/product.routes";
import orderRoutes        from "./modules/orders/order.routes";
import paymentRoutes      from "./modules/payments/payment.routes";
import integrationsRoutes from "./integrations/integrations.routes";

// This file builds and exports the Express app only — it never binds a port,
// creates an HTTP server, or opens the WebSocket server. That work belongs to
// server.ts, so this module can be imported safely by tests (supertest) and
// anything else that just needs the request-handling pipeline.
const app = express();

// ── Security & Middleware ─────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
  credentials: true,
}));
app.use(compression());
app.use(morgan("combined", { stream: { write: msg => logger.info(msg.trim()) } }));

// Raw body for Razorpay webhook signature verification
app.use("/api/v1/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Global rate limiter ───────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max:      100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: "Too many requests, please try again later." },
}));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), version: "1.0.0" });
});

// ── API Routes ────────────────────────────────────────────────────────────────
const API = "/api/v1";
app.use(`${API}/auth`,         authRoutes);
app.use(`${API}/products`,     productRoutes);
app.use(`${API}/orders`,       orderRoutes);
app.use(`${API}/payments`,     paymentRoutes);
app.use(`${API}/integrations`, integrationsRoutes);

// ── Error handlers ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;