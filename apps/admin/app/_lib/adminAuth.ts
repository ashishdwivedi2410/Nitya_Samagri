// apps/admin/app/_lib/adminAuth.ts
// Mock admin session handling — matches the rest of this repo (no backend wiring yet).
// Swap `login()` to call POST /api/v1/auth/login and store the returned JWT
// once the admin app is connected to the real API.

const SESSION_KEY = "nitya_admin_session";

export function getAdminSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAdminAuthed() {
  return !!getAdminSession();
}

// Mock login — accepts any non-empty email + password (min 6 chars), like the
// rest of this codebase's mock forms. Replace with a real API call later.
export function mockAdminLogin(email: string, password: string) {
  if (!email || !password || password.length < 6) return { ok: false };
  const session = { email, role: "ADMIN", name: "Super Admin", loggedInAt: Date.now() };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { ok: true, session };
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}