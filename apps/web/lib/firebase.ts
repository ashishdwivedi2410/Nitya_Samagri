// apps/web/lib/firebase.ts
//
// Firebase client SDK — phone OTP auth only. Firebase sends the SMS and
// confirms the code client-side; we then take the resulting ID token and
// send it to our own backend (POST /api/v1/auth/otp/verify), which verifies
// it with firebase-admin and issues our own JWT pair. See
// backend/src/config/firebase.ts and backend/src/modules/auth/auth.routes.ts.

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type Auth,
  type ConfirmationResult,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

// Invisible reCAPTCHA, required by Firebase phone auth. `containerId` must
// be the id of a div that's mounted in the DOM before this runs (the login
// page renders one). Cached on window so we don't re-create it on every
// "Send OTP" click within the same page load.
export function getRecaptchaVerifier(containerId: string): RecaptchaVerifier {
  const w = window as typeof window & { __nsRecaptchaVerifier?: RecaptchaVerifier };
  if (!w.__nsRecaptchaVerifier) {
    w.__nsRecaptchaVerifier = new RecaptchaVerifier(getFirebaseAuth(), containerId, {
      size: "invisible",
    });
  }
  return w.__nsRecaptchaVerifier;
}

// Kicks off Firebase phone auth: sends the SMS and returns a
// ConfirmationResult, whose .confirm(code) resolves to a UserCredential
// carrying the ID token we forward to our backend.
export async function sendFirebaseOtp(
  phoneE164: string,
  containerId: string
): Promise<ConfirmationResult> {
  const verifier = getRecaptchaVerifier(containerId);
  return signInWithPhoneNumber(getFirebaseAuth(), phoneE164, verifier);
}