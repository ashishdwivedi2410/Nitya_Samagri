// ═══════════════════════════════════════════════════════════════════════════════
// SHARED INFRASTRUCTURE — all helper files concatenated for single download
// In production: split each section into its own file at the path shown
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// src/utils/AppError.ts
// ─────────────────────────────────────────────────────────────────────────────
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode    = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// src/utils/logger.ts
// ─────────────────────────────────────────────────────────────────────────────
import winston from "winston";

export const logger = winston.createLogger({
  level:  process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === "production"
      ? winston.format.json()
      : winston.format.colorize({ all: true })
  ),
  transports: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === "production"
      ? [
          new winston.transports.File({ filename: "logs/error.log",  level: "error" }),
          new winston.transports.File({ filename: "logs/combined.log" }),
        ]
      : []),
  ],
});

// ─────────────────────────────────────────────────────────────────────────────
// src/utils/paginate.ts
// ─────────────────────────────────────────────────────────────────────────────
export function paginate(page: number, limit: number) {
  return { skip: (page - 1) * limit, take: limit };
}

// ─────────────────────────────────────────────────────────────────────────────
// src/config/prisma.ts
// ─────────────────────────────────────────────────────────────────────────────
import { PrismaClient } from "@prisma/client";

declare global { var __prisma: PrismaClient | undefined; }

export const prisma = globalThis.__prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query","warn","error"] : ["warn","error"],
});

if (process.env.NODE_ENV !== "production") globalThis.__prisma = prisma;

// ─────────────────────────────────────────────────────────────────────────────
// src/config/redis.ts
// ─────────────────────────────────────────────────────────────────────────────
import Redis from "ioredis";

export const redis = new Redis({
  host:           process.env.REDIS_HOST     || "localhost",
  port:           Number(process.env.REDIS_PORT)  || 6379,
  password:       process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on("connect",  () => logger.info("Redis connected"));
redis.on("error",    (e) => logger.error("Redis error", e));

// ─────────────────────────────────────────────────────────────────────────────
// src/middlewares/auth.middleware.ts
// ─────────────────────────────────────────────────────────────────────────────
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request { user?: { userId: string; role: string } }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError("Authentication required", 401));
  }
  try {
    const token   = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
    req.user      = decoded;
    next();
  } catch {
    next(new AppError("Invalid or expired token", 401));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// src/middlewares/rbac.middleware.ts
// ─────────────────────────────────────────────────────────────────────────────
export function requireRole(roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError("Authentication required", 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Access denied. Required role: ${roles.join(" or ")}`, 403));
    }
    next();
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// src/middlewares/validate.middleware.ts
// ─────────────────────────────────────────────────────────────────────────────
import { ZodSchema } from "zod";

export function validate(schema: ZodSchema, source: "body" | "query" | "params" = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.errors.map(e => ({ field: e.path.join("."), message: e.message }));
      return next(Object.assign(new AppError("Validation failed", 400), { errors }));
    }
    req[source] = result.data;
    next();
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// src/middlewares/async.middleware.ts
// ─────────────────────────────────────────────────────────────────────────────
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// src/middlewares/error.middleware.ts
// ─────────────────────────────────────────────────────────────────────────────
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const statusCode = err.statusCode || 500;
  const message    = err.isOperational ? err.message : "Internal server error";

  if (process.env.NODE_ENV !== "production") logger.error(err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.errors   && { errors:   err.errors }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// src/middlewares/notFound.middleware.ts
// ─────────────────────────────────────────────────────────────────────────────
export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
}

// ─────────────────────────────────────────────────────────────────────────────
// src/integrations/twilio.ts
// ─────────────────────────────────────────────────────────────────────────────
import twilio from "twilio";

const client = twilio(process.env.TWILIO_SID!, process.env.TWILIO_TOKEN!);

export async function sendSMS(to: string, body: string): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    logger.info(`[SMS MOCK] To: ${to} | Body: ${body}`);
    return;
  }
  await client.messages.create({ body, from: process.env.TWILIO_PHONE!, to });
}

// ─────────────────────────────────────────────────────────────────────────────
// src/integrations/sendgrid.ts
// ─────────────────────────────────────────────────────────────────────────────
export async function sendEmail(params: {
  to: string; subject: string; html: string; text?: string;
}): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    logger.info(`[EMAIL MOCK] To: ${params.to} | Subject: ${params.subject}`);
    return;
  }
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method:  "POST",
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: params.to }], subject: params.subject }],
      from:    { email: process.env.SENDGRID_FROM_EMAIL!, name: "TheKhatuMart" },
      content: [{ type: "text/html", value: params.html }],
    }),
  });
  if (!response.ok) throw new Error(`SendGrid error: ${response.statusText}`);
}