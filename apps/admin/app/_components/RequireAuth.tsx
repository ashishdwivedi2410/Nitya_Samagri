"use client";

// apps/admin/app/_components/RequireAuth.tsx
// Wrap any admin page's returned JSX in <RequireAuth> to gate it behind login.
// Redirects to /login if no session is found. Mock/local-only for now — see
// _lib/adminAuth.ts for the note on wiring this to the real API.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAdminAuthed } from "../_lib/adminAuth";

const C = { bg: "#0D0D0F", saffron: "#E8560A", text: "#F1F0EE", textLight: "#5A5856" };

export default function RequireAuth({ children }) {
  const router = useRouter();
  const [status, setStatus] = useState("checking"); // "checking" | "authed" | "redirecting"

  useEffect(() => {
    if (isAdminAuthed()) {
      setStatus("authed");
    } else {
      setStatus("redirecting");
      router.replace("/login");
    }
  }, [router]);

  if (status !== "authed") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI','Helvetica Neue',sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🪔</div>
          <div style={{ fontSize: 13, color: C.textLight }}>
            {status === "checking" ? "Checking session…" : "Redirecting to login…"}
          </div>
        </div>
      </div>
    );
  }

  return children;
}