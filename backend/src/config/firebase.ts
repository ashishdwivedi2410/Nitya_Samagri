// src/config/firebase.ts
//
// Firebase Admin SDK — used for phone OTP verification (Firebase Auth
// sends the OTP SMS client-side from the Next.js apps; this backend only
// verifies the ID token the client gets back) and available for push
// notifications later. Required in all environments — see env.ts.

import admin from "firebase-admin";
import { env } from "./env";
import { logger } from "../utils/logger";
import { AppError } from "../utils/AppError";

export const firebaseAdmin = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    // .env files store the key with literal \n — turn them back into real newlines
    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

logger.info("Firebase Admin initialized");

/**
 * Verifies a Firebase phone-auth ID token (sent by the client after the
 * user completes OTP verification) and returns the verified phone number.
 * Throws AppError(401) on any invalid/expired token.
 */
export async function verifyOtpToken(idToken: string): Promise<{ phone: string; firebaseUid: string }> {
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    if (!decoded.phone_number) {
      throw new AppError("Token has no verified phone number", 401);
    }
    return { phone: decoded.phone_number, firebaseUid: decoded.uid };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError("Invalid or expired OTP token", 401);
  }
}