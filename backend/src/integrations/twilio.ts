// ─────────────────────────────────────────────────────────────────────────────
// src/integrations/twilio.ts
// ─────────────────────────────────────────────────────────────────────────────
import twilio from "twilio";
import { logger } from "../utils/logger";

const client = twilio(process.env.TWILIO_SID!, process.env.TWILIO_TOKEN!);

export async function sendSMS(to: string, body: string): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    logger.info(`[SMS MOCK] To: ${to} | Body: ${body}`);
    return;
  }
  await client.messages.create({ body, from: process.env.TWILIO_PHONE!, to });
}