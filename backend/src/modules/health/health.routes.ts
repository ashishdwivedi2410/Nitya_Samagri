// src/modules/health/health.routes.ts
//
// Deep health check — unlike GET /health (which only confirms the Express
// process itself is alive), this actually exercises every external
// dependency: MongoDB, Redis, Firebase Admin, Razorpay, and JWT secret
// config. Each check is independent and time-boxed, so one dead service
// can't hang or crash the whole response.
//
// GET /api/v1/system/health          → summary, 200 if all healthy, 503 if any critical check fails
// GET /api/v1/system/health?verbose=1 → adds latency + raw error per check
//
// This route is intentionally NOT behind auth — it's meant to be hit by
// external monitors (GitHub Actions cron, UptimeRobot, etc.) as well as
// internally. It never returns secret values, only pass/fail + latency.

import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import Razorpay from "razorpay";
import { redis } from "../../config/redis";
import { env } from "../../config/env";
import { firebaseAdmin } from "../../config/firebase";
import { logger } from "../../utils/logger";

const router = Router();

type CheckResult = {
  name: string;
  status: "ok" | "fail" | "skipped";
  critical: boolean; // if true, a failure here drags overall status to "degraded"/503
  latencyMs?: number;
  message?: string;
};

async function timed<T>(fn: () => Promise<T>): Promise<{ ms: number; value: T }> {
  const start = Date.now();
  const value = await fn();
  return { ms: Date.now() - start, value };
}

// Every check gets a hard timeout so one hanging dependency can't hang the
// whole endpoint — a monitor waiting 30s+ for a health check is worse than
// a fast, honest "fail".
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms)),
  ]);
}

async function checkMongo(): Promise<CheckResult> {
  try {
    const { ms } = await timed(async () => {
      if (mongoose.connection.readyState !== 1) throw new Error("not connected");
      // ping is cheap and doesn't touch real data
      await withTimeout(mongoose.connection.db!.admin().ping(), 3000);
    });
    return { name: "mongodb", status: "ok", critical: true, latencyMs: ms };
  } catch (err) {
    return { name: "mongodb", status: "fail", critical: true, message: (err as Error).message };
  }
}

async function checkRedis(): Promise<CheckResult> {
  try {
    const { ms } = await timed(() => withTimeout(redis.ping(), 3000));
    return { name: "redis", status: "ok", critical: false, latencyMs: ms };
  } catch (err) {
    return { name: "redis", status: "fail", critical: false, message: (err as Error).message };
  }
}

async function checkFirebase(): Promise<CheckResult> {
  try {
    const { ms } = await timed(async () => {
      // listUsers(1) is a real authenticated call to the Firebase Admin
      // API — cheap, read-only, and proves the service-account creds and
      // project ID actually work (not just that they're present).
      await withTimeout(firebaseAdmin.auth().listUsers(1), 5000);
    });
    return { name: "firebase", status: "ok", critical: true, latencyMs: ms };
  } catch (err) {
    return { name: "firebase", status: "fail", critical: true, message: (err as Error).message };
  }
}

async function checkRazorpay(): Promise<CheckResult> {
  try {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      return { name: "razorpay", status: "fail", critical: true, message: "RAZORPAY_KEY_ID/SECRET not set" };
    }
    const client = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
    const { ms } = await timed(() =>
      // Cheapest authenticated, read-only call: list 1 payment. Proves the
      // key pair is valid and not just non-empty.
      withTimeout(client.payments.all({ count: 1 }), 5000)
    );
    return { name: "razorpay", status: "ok", critical: true, latencyMs: ms };
  } catch (err) {
    return { name: "razorpay", status: "fail", critical: true, message: (err as Error).message };
  }
}

async function checkJwtConfig(): Promise<CheckResult> {
  // No network call possible/needed here — env.ts already zod-validates
  // JWT_SECRET/JWT_REFRESH_SECRET are present and >=32 chars at boot, so if
  // the process is running at all, this is structurally guaranteed true.
  // Kept as an explicit check anyway so it shows up in the same report
  // instead of being an invisible assumption.
  const ok = env.JWT_SECRET?.length >= 32 && env.JWT_REFRESH_SECRET?.length >= 32;
  return { name: "jwt_config", status: ok ? "ok" : "fail", critical: true };
}

router.get(
  "/health",
  async (req: Request, res: Response) => {
    const verbose = req.query.verbose === "1";

    const results = await Promise.all([
      checkMongo(),
      checkRedis(),
      checkFirebase(),
      checkRazorpay(),
      checkJwtConfig(),
    ]);

    const criticalFailures = results.filter(r => r.critical && r.status === "fail");
    const anyFailures      = results.filter(r => r.status === "fail");

    const overallStatus =
      criticalFailures.length > 0 ? "unhealthy" :
      anyFailures.length      > 0 ? "degraded"  :
      "healthy";

    if (overallStatus === "unhealthy") {
      logger.error("Deep health check: unhealthy", { failures: criticalFailures.map(f => f.name) });
    } else if (overallStatus === "degraded") {
      logger.warn("Deep health check: degraded", { failures: anyFailures.map(f => f.name) });
    }

    const body = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: results.map(r =>
        verbose ? r : { name: r.name, status: r.status, critical: r.critical }
      ),
    };

    res.status(overallStatus === "unhealthy" ? 503 : 200).json(body);
  }
);

export default router;