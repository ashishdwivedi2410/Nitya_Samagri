"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/auth";
import { PageShell, COLORS } from "../../lib/storefront";

function fmt(d) {
  try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return ""; }
}

export default function FestivalsPage() {
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiFetch("/cms/festivals-public")
      .then(({ ok, body }) => {
        if (cancelled) return;
        if (!ok) { setError(body.message || "Couldn't load festivals."); return; }
        setFestivals(body.data.items || []);
      })
      .catch(() => { if (!cancelled) setError("Couldn't reach the server. Please try again."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <PageShell>
      <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 32, margin: "0 0 6px" }}>Festival Collections</h1>
      <p style={{ color: COLORS.textLight, fontSize: 14, margin: "0 0 28px" }}>Curated kits and complete puja packages for every occasion.</p>

      {loading ? (
        <div style={{ padding: "48px 0", textAlign: "center", color: COLORS.textLight }}>Loading festivals…</div>
      ) : error ? (
        <div style={{ padding: "48px 0", textAlign: "center", color: "#C0392B" }}>{error}</div>
      ) : festivals.length === 0 ? (
        <div style={{ padding: "48px 0", textAlign: "center", color: COLORS.textLight }}>No festival collections right now. Check back soon!</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
          {festivals.map((f) => {
            const color = f.color || COLORS.saffron;
            return (
              <Link key={f._id} href={`/festival/${f.slug}`} style={{ textDecoration: "none", background: COLORS.white, border: `1.5px solid ${COLORS.creamDark}`, borderTop: `5px solid ${color}`, borderRadius: 16, padding: "24px 20px", display: "block" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                  {f.status === "active" ? "Live now" : `Starts ${fmt(f.startDate)}`}
                </div>
                <div style={{ fontFamily: "'Georgia', serif", fontSize: 24, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>{f.icon ? `${f.icon} ` : ""}{f.name}</div>
                {f.description && <div style={{ fontSize: 13, color: COLORS.textMid, marginBottom: 14, lineHeight: 1.5 }}>{f.description}</div>}
                <div style={{ fontSize: 12, color: COLORS.textLight, marginBottom: 12 }}>{(f.productIds || []).length} products</div>
                <span style={{ fontSize: 13, fontWeight: 700, color }}>Explore →</span>
              </Link>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}