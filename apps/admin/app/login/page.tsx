"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { mockAdminLogin, isAdminAuthed } from "../_lib/adminAuth";

// ─── THEME: Obsidian + Saffron — matches dashboard/store/coupons ─────────────
const C = {
  bg:         "#0D0D0F",
  bgCard:     "#141416",
  bgElevated: "#1A1A1E",
  saffron:    "#E8560A",
  saffronBg:  "#1A0A04",
  marigold:   "#F5A623",
  red:        "#EF4444",
  redBg:      "#1A0707",
  text:       "#F1F0EE",
  textMid:    "#9A9890",
  textLight:  "#5A5856",
  border:     "#242428",
  borderLight:"#2E2E34",
  white:      "#FFFFFF",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`,
  fontSize: 14, color: C.text, background: C.bgElevated, outline: "none", boxSizing: "border-box",
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If a session already exists, skip straight to the dashboard.
  useEffect(() => {
    if (isAdminAuthed()) router.replace("/dashboard");
  }, [router]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) { setError("Enter your admin email."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    // Mock auth — replace with a real call to POST /api/v1/auth/login
    // (with role check enforced server-side by requireRole middleware).
    setTimeout(() => {
      const res = mockAdminLogin(email.trim(), password);
      setLoading(false);
      if (!res.ok) { setError("Invalid email or password."); return; }
      router.push("/dashboard");
    }, 700);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI','Helvetica Neue',sans-serif", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 32 }}>
          <span style={{ fontSize: 26 }}>🪔</span>
          <div>
            <div style={{ fontFamily: "'Georgia',serif", fontWeight: 700, fontSize: 17, color: C.saffron, lineHeight: 1 }}>nityasamagri</div>
            <div style={{ fontSize: 10, color: C.textLight, letterSpacing: 1.5, textTransform: "uppercase" }}>Admin Panel</div>
          </div>
        </div>

        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 18, padding: "32px 32px" }}>
          <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 20, color: C.text, margin: "0 0 4px" }}>Sign in</h1>
          <p style={{ fontSize: 13, color: C.textLight, margin: "0 0 24px" }}>Restricted to authorized staff only.</p>

          <form onSubmit={submit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textMid, marginBottom: 6 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@nityasamagri.com" style={inputStyle} autoFocus />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textMid, marginBottom: 6 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
            </div>

            <div style={{ textAlign: "right", marginBottom: 20 }}>
              <span style={{ fontSize: 12, color: C.saffron, fontWeight: 600, cursor: "pointer" }}>Forgot password?</span>
            </div>

            {error && (
              <div style={{ background: C.redBg, color: C.red, fontSize: 12, fontWeight: 600, padding: "9px 12px", borderRadius: 8, marginBottom: 16, border: `1px solid ${C.red}33` }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "13px", borderRadius: 11, background: C.saffron, color: C.white,
              border: "none", fontWeight: 700, fontSize: 14, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1,
            }}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: C.textLight }}>
          🔒 Sessions are logged. Unauthorized access is prohibited.
        </div>
      </div>
    </div>
  );
}