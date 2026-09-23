"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch, isLoggedIn } from "../../lib/auth";

const C = {
  saffron: "#E8560A", saffronBg: "#FFF3EC",
  marigold: "#F5A623", marigoldLight: "#FAC65A",
  cream: "#FFF8EE", creamDark: "#F0E4CE",
  bark: "#5C3317",
  text: "#2C1A0E", textMid: "#5C3D20", textLight: "#9A7050",
  white: "#FFFFFF",
  green: "#1A7A3C", greenBg: "#EDFAF3",
  border: "#E8D8BC",
  gold: "#C8860A", goldBg: "#FFFBE8",
  red: "#C0392B", redBg: "#FFF0EE",
};

function Stars({ value, size = 14, onChange }: { value: number; size?: number; onChange?: (n: number) => void }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} onClick={onChange ? () => onChange(n) : undefined}
          style={{ fontSize: size, color: n <= value ? C.gold : C.creamDark, cursor: onChange ? "pointer" : "default" }}>★</span>
      ))}
    </div>
  );
}

type PendingItem = { productId: string; name: string; orderId?: string; deliveredOn?: string };
type SubmittedReview = { id: string; name: string; rating: number; text: string; date: string };

function WriteReviewForm({ item, onSubmit, onCancel, submitting }: {
  item: PendingItem; onSubmit: (vals: { rating: number; text: string }) => void; onCancel: () => void; submitting: boolean;
}) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");

  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px dashed ${C.border}` }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.textMid, marginBottom: 8 }}>Your Rating</div>
      <Stars value={rating} size={24} onChange={setRating} />
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Share your experience with this product…" rows={3}
        style={{ width: "100%", marginTop: 12, padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text, background: C.cream, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <button disabled={rating === 0 || !text.trim() || submitting} onClick={() => onSubmit({ rating, text })}
          style={{ padding: "9px 18px", borderRadius: 9, background: C.saffron, color: C.white, border: "none", fontWeight: 700, fontSize: 12, cursor: rating === 0 || !text.trim() || submitting ? "default" : "pointer", opacity: rating === 0 || !text.trim() || submitting ? 0.6 : 1 }}>
          {submitting ? "Submitting…" : "Submit Review"}
        </button>
        <button onClick={onCancel} style={{ padding: "9px 18px", borderRadius: 9, border: `1.5px solid ${C.border}`, background: C.white, color: C.textMid, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Cancel</button>
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const [tab, setTab] = useState("pending");
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [submitted, setSubmitted] = useState<SubmittedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [writingId, setWritingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    if (!isLoggedIn()) { setError("Please log in to see your reviews."); setLoading(false); return; }
    setLoading(true);
    setError("");
    Promise.all([apiFetch("/reviews/pending"), apiFetch("/reviews/mine")])
      .then(([pendingRes, mineRes]) => {
        if (!pendingRes.ok) throw new Error(pendingRes.body.message || "Couldn't load pending reviews.");
        if (!mineRes.ok) throw new Error(mineRes.body.message || "Couldn't load your reviews.");
        setPending(pendingRes.body.data.pending.map((p: any) => ({
          productId: p.productId, name: p.name, orderId: p.orderId,
          deliveredOn: p.deliveredOn ? new Date(p.deliveredOn).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "",
        })));
        setSubmitted(mineRes.body.data.reviews.map((r: any) => ({
          id: r._id, name: r.productId?.name || "Product", rating: r.rating, text: r.comment || "",
          date: r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "",
        })));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Something went wrong."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async (item: PendingItem, { rating, text }: { rating: number; text: string }) => {
    setSubmitting(true);
    try {
      const { ok, body } = await apiFetch("/reviews", {
        method: "POST",
        body: JSON.stringify({ productId: item.productId, rating, comment: text }),
      });
      if (!ok) throw new Error(body.message || "Couldn't submit review.");
      setWritingId(null);
      setTab("submitted");
      load(); // refresh both lists from the server rather than guessing the new state locally
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (id: string) => {
    const { ok, body } = await apiFetch(`/reviews/${id}`, { method: "DELETE" });
    if (!ok) { setError(body.message || "Couldn't delete review."); return; }
    load();
  };

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'Segoe UI','Helvetica Neue',sans-serif" }}>
      <nav style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <span style={{ fontSize: 20 }}>🪔</span>
            <span style={{ fontFamily: "'Georgia',serif", fontWeight: 700, fontSize: 16, color: C.saffron }}>nityasamagri</span>
          </Link>
          <Link href="/account" style={{ fontSize: 13, color: C.textMid, textDecoration: "none", fontWeight: 600 }}>My Account →</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px" }}>
        <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 26, color: C.text, margin: "0 0 6px" }}>My Reviews</h1>
        <p style={{ fontSize: 13, color: C.textLight, margin: "0 0 24px" }}>Share your experience and help other customers choose well.</p>

        {error && (
          <div style={{ background: C.redBg, color: C.red, fontSize: 12, fontWeight: 600, padding: "10px 14px", borderRadius: 10, marginBottom: 16 }}>{error}</div>
        )}

        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: C.textLight, fontSize: 13 }}>Loading…</div>
        ) : (
          <>
            <div style={{ display: "flex", background: C.creamDark, borderRadius: 12, padding: 4, marginBottom: 24, width: "fit-content" }}>
              {[["pending", `Pending (${pending.length})`], ["submitted", `Submitted (${submitted.length})`]].map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)} style={{
                  padding: "9px 20px", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12,
                  background: tab === k ? C.white : "transparent", color: tab === k ? C.saffron : C.textMid,
                  boxShadow: tab === k ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}>{l}</button>
              ))}
            </div>

            {tab === "pending" ? (
              pending.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: C.textLight }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                  <div style={{ fontSize: 14 }}>No pending reviews — you're all caught up!</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {pending.map(item => (
                    <div key={item.productId} style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "18px 20px" }}>
                      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                        <div style={{ width: 48, height: 48, borderRadius: 10, background: C.cream, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🪔</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>Order #{item.orderId} · Delivered {item.deliveredOn}</div>
                        </div>
                        {writingId !== item.productId && (
                          <button onClick={() => setWritingId(item.productId)} style={{ padding: "8px 16px", borderRadius: 9, background: C.saffron, color: C.white, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", flexShrink: 0 }}>
                            ✍️ Write a Review
                          </button>
                        )}
                      </div>
                      {writingId === item.productId && (
                        <WriteReviewForm item={item} submitting={submitting} onSubmit={(vals) => handleSubmit(item, vals)} onCancel={() => setWritingId(null)} />
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : (
              submitted.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: C.textLight }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>⭐</div>
                  <div style={{ fontSize: 14 }}>You haven't submitted any reviews yet.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {submitted.map(r => (
                    <div key={r.id} style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "18px 20px" }}>
                      <div style={{ display: "flex", gap: 14 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 10, background: C.cream, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🪔</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{r.name}</div>
                              <div style={{ marginTop: 4 }}><Stars value={r.rating} /></div>
                            </div>
                            <span style={{ fontSize: 11, color: C.textLight, whiteSpace: "nowrap" }}>{r.date}</span>
                          </div>
                          <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6, margin: "10px 0" }}>{r.text}</p>
                          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            <span onClick={() => deleteReview(r.id)} style={{ fontSize: 11, color: C.red, fontWeight: 600, cursor: "pointer" }}>Delete</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}