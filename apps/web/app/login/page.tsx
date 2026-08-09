"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const C = {
  saffron: "#E8560A", saffronDark: "#B8400A", saffronBg: "#FFF3EC",
  marigold: "#F5A623", marigoldLight: "#FAC65A",
  cream: "#FFF8EE", creamDark: "#F0E4CE",
  bark: "#5C3317", barkLight: "#7A4A28",
  text: "#2C1A0E", textMid: "#5C3D20", textLight: "#9A7050",
  white: "#FFFFFF",
  green: "#1A7A3C", greenBg: "#EDFAF3",
  border: "#E8D8BC",
  gold: "#C8860A", goldBg: "#FFFBE8",
  blue: "#1A5C9E", blueBg: "#EEF4FF",
  red: "#C0392B", redBg: "#FFF0EE",
};

const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`,
  fontSize: 14, color: C.text, background: C.cream, outline: "none", boxSizing: "border-box",
};

const primaryBtn = {
  width: "100%", padding: "13px", borderRadius: 11, background: C.saffron, color: C.white,
  border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer",
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textMid, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function OtpBoxes({ value, onChange }) {
  const refs = useRef([]);
  const update = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = value.split("");
    next[i] = val;
    onChange(next.join("").slice(0, 6));
    if (val && refs.current[i + 1]) refs.current[i + 1].focus();
  };
  const onKeyDown = (i, e) => {
    if (e.key === "Backspace" && !value[i] && refs.current[i - 1]) refs.current[i - 1].focus();
  };
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <input
          key={i}
          ref={el => (refs.current[i] = el)}
          value={value[i] || ""}
          onChange={e => update(i, e.target.value)}
          onKeyDown={e => onKeyDown(i, e)}
          maxLength={1}
          inputMode="numeric"
          style={{ width: 42, height: 48, textAlign: "center", fontSize: 18, fontWeight: 700, borderRadius: 10, border: `1.5px solid ${C.border}`, color: C.text, background: C.cream, outline: "none" }}
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");       // "login" | "signup"
  const [method, setMethod] = useState("password"); // "password" | "otp"  (login mode only)
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const sendOtp = () => {
    if (phone.trim().length < 10) { setError("Enter a valid 10-digit phone number."); return; }
    setError("");
    setOtpSent(true);
    setResendIn(30);
  };

  const submit = (e) => {
    e.preventDefault();
    setError("");

    if (mode === "login" && method === "password" && (!phone || !password)) {
      setError("Enter your phone number and password."); return;
    }
    if (mode === "login" && method === "otp" && (!otpSent || otp.length !== 6)) {
      setError("Enter the 6-digit OTP sent to your phone."); return;
    }
    if (mode === "signup") {
      if (!name || phone.trim().length < 10 || !password) { setError("Fill in your name, phone number and a password."); return; }
      if (password !== confirmPassword) { setError("Passwords don't match."); return; }
      if (!agree) { setError("Please accept the Terms & Privacy Policy to continue."); return; }
    }

    setLoading(true);
    // Mock auth — replace with a real call to /api/v1/auth/login or /api/v1/auth/otp/verify
    setTimeout(() => {
      setLoading(false);
      setDone(true);
      setTimeout(() => router.push("/account"), 900);
    }, 1000);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'Segoe UI','Helvetica Neue',sans-serif", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      {/* Left — brand panel */}
      <div style={{
        background: `linear-gradient(160deg, ${C.bark} 0%, #3A200E 100%)`, color: C.white,
        display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px 56px",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: C.white }}>
          <span style={{ fontSize: 26 }}>🪔</span>
          <span style={{ fontFamily: "'Georgia',serif", fontWeight: 700, fontSize: 18, color: C.marigoldLight }}>nityasamagri</span>
        </Link>

        <div>
          <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 34, lineHeight: 1.25, margin: "0 0 16px" }}>
            Welcome back to your<br />spiritual journey
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, maxWidth: 380, marginBottom: 32 }}>
            Sign in to track orders, save addresses, and get faster checkout on every visit.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              ["📦", "Track every order in real time"],
              ["⚡", "One-tap checkout with saved addresses"],
              ["🎁", "Early access to festival offers"],
            ].map(([icon, text]) => (
              <div key={text} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>© 2026 nityasamagri. All rights reserved.</div>
      </div>

      {/* Right — form */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          {done ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontFamily: "'Georgia',serif", fontSize: 20, color: C.text, marginBottom: 6 }}>
                {mode === "signup" ? "Account created!" : "Signed in!"}
              </div>
              <div style={{ fontSize: 13, color: C.textLight }}>Taking you to your account…</div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div style={{ display: "flex", background: C.creamDark, borderRadius: 12, padding: 4, marginBottom: 28 }}>
                {[["login", "Log In"], ["signup", "Sign Up"]].map(([k, l]) => (
                  <button key={k} onClick={() => { setMode(k); setError(""); }} style={{
                    flex: 1, padding: "10px", borderRadius: 9, border: "none", cursor: "pointer",
                    fontWeight: 700, fontSize: 13,
                    background: mode === k ? C.white : "transparent",
                    color: mode === k ? C.saffron : C.textMid,
                    boxShadow: mode === k ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  }}>{l}</button>
                ))}
              </div>

              <h2 style={{ fontFamily: "'Georgia',serif", fontSize: 24, color: C.text, margin: "0 0 4px" }}>
                {mode === "login" ? "Log in to your account" : "Create your account"}
              </h2>
              <p style={{ fontSize: 13, color: C.textLight, margin: "0 0 24px" }}>
                {mode === "login" ? "Enter your details to continue." : "It only takes a minute."}
              </p>

              {/* Login method toggle */}
              {mode === "login" && (
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  {[["password", "Password"], ["otp", "OTP"]].map(([k, l]) => (
                    <button key={k} onClick={() => { setMethod(k); setError(""); setOtpSent(false); setOtp(""); }} style={{
                      padding: "6px 16px", borderRadius: 999, border: `1.5px solid ${method === k ? C.saffron : C.border}`,
                      background: method === k ? C.saffronBg : "transparent", color: method === k ? C.saffron : C.textMid,
                      fontWeight: 600, fontSize: 12, cursor: "pointer",
                    }}>{l}</button>
                  ))}
                </div>
              )}

              <form onSubmit={submit}>
                {mode === "signup" && (
                  <Field label="Full Name">
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Rahul Sharma" style={inputStyle} />
                  </Field>
                )}

                <Field label="Phone Number">
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ ...inputStyle, width: 56, textAlign: "center", flexShrink: 0 }}>+91</span>
                    <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="98765 43210" style={inputStyle} />
                  </div>
                </Field>

                {mode === "signup" && (
                  <Field label="Email (optional)">
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
                  </Field>
                )}

                {(mode === "signup" || method === "password") && (
                  <Field label="Password">
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
                  </Field>
                )}

                {mode === "signup" && (
                  <Field label="Confirm Password">
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
                  </Field>
                )}

                {mode === "login" && method === "otp" && (
                  <Field label={otpSent ? "Enter OTP" : ""}>
                    {!otpSent ? (
                      <button type="button" onClick={sendOtp} style={{ ...primaryBtn, background: C.white, color: C.saffron, border: `1.5px solid ${C.saffron}` }}>
                        Send OTP
                      </button>
                    ) : (
                      <>
                        <OtpBoxes value={otp} onChange={setOtp} />
                        <div style={{ marginTop: 10, fontSize: 12, color: C.textLight }}>
                          {resendIn > 0 ? `Resend OTP in ${resendIn}s` : (
                            <span onClick={sendOtp} style={{ color: C.saffron, fontWeight: 600, cursor: "pointer" }}>Resend OTP</span>
                          )}
                        </div>
                      </>
                    )}
                  </Field>
                )}

                {mode === "login" && method === "password" && (
                  <div style={{ textAlign: "right", marginTop: -8, marginBottom: 20 }}>
                    <span style={{ fontSize: 12, color: C.saffron, fontWeight: 600, cursor: "pointer" }}>Forgot password?</span>
                  </div>
                )}

                {mode === "signup" && (
                  <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 20, cursor: "pointer" }}>
                    <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} style={{ marginTop: 2, accentColor: C.saffron }} />
                    <span style={{ fontSize: 12, color: C.textMid, lineHeight: 1.5 }}>
                      I agree to the Terms of Service and Privacy Policy
                    </span>
                  </label>
                )}

                {error && (
                  <div style={{ background: C.redBg, color: C.red, fontSize: 12, fontWeight: 600, padding: "9px 12px", borderRadius: 8, marginBottom: 16 }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} style={{ ...primaryBtn, opacity: loading ? 0.7 : 1, cursor: loading ? "default" : "pointer" }}>
                  {loading ? "Please wait…" : mode === "login" ? (method === "otp" && otpSent ? "Verify & Log In" : method === "otp" ? "Send OTP" : "Log In") : "Create Account"}
                </button>
              </form>

              <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: C.textLight }}>
                {mode === "login" ? (
                  <>New here? <span onClick={() => { setMode("signup"); setError(""); }} style={{ color: C.saffron, fontWeight: 700, cursor: "pointer" }}>Create an account</span></>
                ) : (
                  <>Already have an account? <span onClick={() => { setMode("login"); setError(""); }} style={{ color: C.saffron, fontWeight: 700, cursor: "pointer" }}>Log in</span></>
                )}
              </div>

              <div style={{ textAlign: "center", marginTop: 16 }}>
                <Link href="/" style={{ fontSize: 12, color: C.textLight, textDecoration: "none" }}>← Back to Shop</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
