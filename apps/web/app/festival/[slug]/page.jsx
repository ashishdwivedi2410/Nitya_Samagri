"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../lib/auth";
import { PageShell, ProductGrid, normalizeProduct, COLORS } from "../../../lib/storefront";

function fmt(d) {
  try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return ""; }
}

export default function FestivalPage() {
  const { slug } = useParams();
  const [festival, setFestival] = useState(null);
  const [products, setProducts] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setNotFound(false); setError("");
    apiFetch(`/cms/festivals-public/${slug}`)
      .then(({ ok, status, body }) => {
        if (cancelled) return;
        if (status === 404) { setNotFound(true); return; }
        if (!ok) { setError(body.message || "Couldn't load festival."); return; }
        const item = body.data.item;
        setFestival(item);
        // productIds is populated with full product docs. Only show active,
        // and category name isn't populated here, so the card falls back to a
        // generic label — fine for a campaign grid.
        setProducts((item.productIds || []).filter((p) => p && p.status === "active").map(normalizeProduct));
      })
      .catch(() => { if (!cancelled) setError("Couldn't reach the server. Please try again."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  if (notFound) {
    return (
      <PageShell>
        <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 28 }}>Festival not found</h1>
        <p style={{ color: COLORS.textLight }}>This collection isn't available right now.</p>
        <Link href="/festival" style={{ color: COLORS.saffron, fontWeight: 600 }}>See all festivals →</Link>
      </PageShell>
    );
  }

  const color = festival?.color || COLORS.saffron;

  return (
    <PageShell>
      <div style={{ fontSize: 12, color: COLORS.textLight, marginBottom: 14 }}>
        <Link href="/" style={{ color: COLORS.textLight, textDecoration: "none" }}>Home</Link> /{" "}
        <Link href="/festival" style={{ color: COLORS.textLight, textDecoration: "none" }}>Festivals</Link> / {festival?.name || "…"}
      </div>

      {loading ? (
        <div style={{ padding: "48px 0", textAlign: "center", color: COLORS.textLight }}>Loading…</div>
      ) : error ? (
        <div style={{ padding: "48px 0", textAlign: "center", color: "#C0392B" }}>{error}</div>
      ) : festival && (
        <>
          <div style={{
            borderRadius: 20, padding: "40px 32px", marginBottom: 32, color: COLORS.white,
            background: festival.bannerImage ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${festival.bannerImage}) center/cover` : `linear-gradient(135deg, ${color}, ${COLORS.bark})`,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", opacity: 0.9, marginBottom: 10 }}>
              {festival.status === "active" ? "Live now" : "Coming soon"} · {fmt(festival.startDate)} – {fmt(festival.endDate)}
            </div>
            <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 40, margin: "0 0 12px" }}>{festival.icon ? `${festival.icon} ` : ""}{festival.name}</h1>
            {festival.description && <p style={{ fontSize: 15, lineHeight: 1.6, maxWidth: 620, margin: 0, opacity: 0.95 }}>{festival.description}</p>}
          </div>

          <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 24, margin: "0 0 20px" }}>Festival essentials</h2>
          <ProductGrid products={products} />
        </>
      )}
    </PageShell>
  );
}