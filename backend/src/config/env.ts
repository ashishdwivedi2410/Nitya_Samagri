// src/config/env.ts
//
// Central env loader/validator. Every other config file (database, redis,
// firebase) and the integrations (razorpay, twilio, etc.) read from here
// instead of touching process.env directly, so a missing var fails fast
// at boot instead of crashing deep inside a request handler.

import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  LOG_LEVEL: z.string().default("info"),

  ALLOWED_ORIGINS: z
    .string()
    .default("http://localhost:3000,http://localhost:3001,http://localhost:3002")
    .transform((s) => s.split(",").map((o) => o.trim())),

  // MongoDB (was DATABASE_URL/Postgres)
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),

  // Redis
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 chars"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 chars"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_ACCOUNT_NUMBER: z.string().optional(),

  // Eshopbox (replaces Shiprocket)
  ESHOPBOX_API_TOKEN: z.string().optional(),
  ESHOPBOX_EXTERNAL_CHANNEL_ID: z.string().optional(),
  ESHOPBOX_WEBHOOK_SECRET: z.string().optional(),

  // Twilio — no longer used for OTP/login (that's Firebase now), but still
  // used by integrations/twilio.ts for order-status SMS. NOTE: twilio.ts
  // reads these via process.env directly rather than importing `env` from
  // here — listed here too so `env.ts` stays the source of truth for what
  // vars the app actually uses, even though this particular file doesn't
  // consume it that way yet.
  TWILIO_SID: z.string().optional(),
  TWILIO_TOKEN: z.string().optional(),
  TWILIO_PHONE: z.string().optional(),

  // Email — Nodemailer over Gmail/Google Workspace SMTP (not SendGrid).
  // GMAIL_APP_PASSWORD must be a Google App Password, not the account's
  // real password — see .env.example for how to generate one.
  GMAIL_USER: z.string().optional(),
  GMAIL_APP_PASSWORD: z.string().optional(),

  // WhatsApp Business API
  WHATSAPP_API_URL: z.string().optional(),
  WHATSAPP_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_ID: z.string().optional(),

  // AWS S3 (media uploads)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),

  // Firebase — phone OTP auth (Firebase sends the SMS client-side; backend
  // verifies the returned ID token via Admin SDK) + optional push notifications.
  // Required in production since auth.routes.ts's OTP flow depends on it.
  FIREBASE_PROJECT_ID: z.string().min(1, "FIREBASE_PROJECT_ID is required for OTP auth"),
  FIREBASE_CLIENT_EMAIL: z.string().min(1, "FIREBASE_CLIENT_EMAIL is required for OTP auth"),
  FIREBASE_PRIVATE_KEY: z.string().min(1, "FIREBASE_PRIVATE_KEY is required for OTP auth"),
});

type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("❌ Invalid environment configuration:");
    for (const issue of parsed.error.issues) {
      // eslint-disable-next-line no-console
      console.error(`   ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
export type { Env };