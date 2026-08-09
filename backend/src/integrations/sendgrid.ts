// ─────────────────────────────────────────────────────────────────────────────
// src/integrations/sendgrid.ts
// ─────────────────────────────────────────────────────────────────────────────
import { logger } from "../utils/logger";

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
      from:    { email: process.env.SENDGRID_FROM_EMAIL!, name: "nityasamagri" },
      content: [{ type: "text/html", value: params.html }],
    }),
  });
  if (!response.ok) throw new Error(`SendGrid error: ${response.statusText}`);
}