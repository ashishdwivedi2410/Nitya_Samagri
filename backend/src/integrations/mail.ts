// ─────────────────────────────────────────────────────────────────────────────
// src/integrations/mail.ts
//
// Replaces src/integrations/sendgrid.ts. Sends transactional email via
// Nodemailer over Gmail/Google Workspace SMTP instead of the SendGrid API
// — Firebase itself has no transactional email API, this is what "use
// Firebase for email" resolves to in practice (Gmail SMTP tied to the
// same Google account as the Firebase project).
//
// GMAIL_APP_PASSWORD must be a Google App Password (myaccount.google.com/
// apppasswords, requires 2FA), not the account's normal login password.
//
// sendEmail()'s signature is unchanged from the old sendgrid.ts so nothing
// calling it needs to change.
// ─────────────────────────────────────────────────────────────────────────────

import nodemailer, { Transporter } from "nodemailer";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { AppError } from "../utils/AppError";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    throw new AppError("Email is not configured (GMAIL_USER / GMAIL_APP_PASSWORD missing)", 500);
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
    });
  }
  return transporter;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    logger.info(`[EMAIL MOCK] To: ${params.to} | Subject: ${params.subject}`);
    return;
  }

  await getTransporter().sendMail({
    from: `"nityasamagri" <${env.GMAIL_USER}>`,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });
}