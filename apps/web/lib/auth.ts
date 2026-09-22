// apps/web/lib/auth.ts
//
// Session storage + an authenticated fetch wrapper for the backend API.
// The backend (backend/src/modules/auth/auth.routes.ts) returns an
// { accessToken, refreshToken, user } pair from /auth/login, /auth/otp/verify
// and /auth/refresh. We keep both tokens in localStorage and attach
// `Authorization: Bearer <accessToken>` to every request; on a 401 we try
// POST /auth/refresh once and replay the original request before giving up.

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const ACCESS_TOKEN_KEY = "ns_access_token";
const REFRESH_TOKEN_KEY = "ns_refresh_token";
const USER_KEY = "ns_user";

export type SessionUser = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: string;
};

export function saveSession(tokens: { accessToken: string; refreshToken: string }, user: SessionUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as SessionUser) : null;
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}

// Converts a 10-digit Indian mobile number (with or without spaces) to the
// +91XXXXXXXXXX shape the backend's Zod schemas require. Returns null if it
// doesn't look like a valid Indian mobile number.
export function toE164Phone(rawPhone: string): string | null {
  const digits = rawPhone.replace(/\D/g, "").replace(/^91/, "");
  if (!/^[6-9]\d{9}$/.test(digits)) return null;
  return `+91${digits}`;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    clearSession();
    return null;
  }
  const body = await res.json();
  const newAccess = body?.data?.accessToken;
  const newRefresh = body?.data?.refreshToken;
  if (!newAccess || !newRefresh) {
    clearSession();
    return null;
  }
  localStorage.setItem(ACCESS_TOKEN_KEY, newAccess);
  localStorage.setItem(REFRESH_TOKEN_KEY, newRefresh);
  return newAccess;
}

// Thin fetch wrapper: prefixes API_URL, attaches the bearer token, retries
// once via /auth/refresh on a 401, and always returns parsed JSON matching
// the backend's { success, data } / { success, message, errors } shape.
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; body: T & { success: boolean; message?: string } }> {
  const doFetch = async (token: string | null) => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    return fetch(`${API_URL}${path}`, { ...options, headers });
  };

  let res = await doFetch(getAccessToken());

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) res = await doFetch(newToken);
  }

  const body = await res.json().catch(() => ({ success: false, message: "Invalid server response" }));
  return { ok: res.ok, status: res.status, body };
}