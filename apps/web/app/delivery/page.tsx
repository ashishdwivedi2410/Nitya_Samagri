"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch, isLoggedIn } from "../../lib/auth";

const C = {
  saffron: "#E8560A", saffronBg: "#FFF3EC",
  cream: "#FFF8EE", creamDark: "#F0E4CE",
  text: "#2C1A0E", textMid: "#5C3D20", textLight: "#9A7050",
  white: "#FFFFFF",
  green: "#1A7A3C", greenBg: "#EDFAF3",
  border: "#E8D8BC",
  blue: "#1A5C9E", blueBg: "#EEF4FF",
  red: "#C0392B", redBg: "#FFF0EE",
};

// backend Order.status enum (Order.ts) → the linear stage list this page
// draws. NDR/cancelled/returned/refunded are terminal/exception states
// shown as a banner instead of forced into the linear timeline.
const STAGES = [
  { key: "pending",           label: "Order Placed",     icon: "🧾" },
  { key: "confirmed",         label: "Order Confirmed",  icon: "✅" },
  { key: "processing",        label: "Packed",           icon: "📦" },
  { key: "shipped",           label: "Shipped",          icon: "🚚" },
  { key: "out_for_delivery",  label: "Out for Delivery", icon: "🛵" },
  { key: "delivered",         label: "Delivered",        icon: "🏠" },
];
const EXCEPTION_STATUSES = ["NDR", "cancelled", "returned", "refunded"];

function currentIndex(status: string) {
  return STAGES.findIndex(s => s.key === status);
}

// Loosely-typed shapes just strict enough to stop TS from collapsing these
// to `never` after the early-return guards below. Swap for real Order /
// Address / TimelineEvent / Tracking types if/when they exist in this app.
type OrderItem = { productName: string; qty: number; price: number };
type TimelineEvent = { status: string; createdAt: string };
type Address = { fullName: string; line1: string; line2?: string; city: string; state: string; pincode: string; phone: string };
type Order = {
  orderId: string;
  status: string;
  total: number;
  createdAt: string;
  addressId: Address;
  items: OrderItem[];
  timeline?: TimelineEvent[];
};
type Tracking = { courierName?: string; awb?: string };

export default function DeliveryTrackingPage() {
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get("orderId");

  const [order, setOrder] = useState<Order | null>(null);
  const [courier, setCourier] = useState<Tracking | null>(null); // best-effort — may stay null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) { setError("Please log in to track your orders."); setLoading(false); return; }

    let cancelled = false;
    setLoading(true);
    setError("");

    (async () => {
      try {
        let orderId = orderIdParam;
        if (!orderId) {
          // No order specified — fall back to the most recent order.
          const { ok, body } = await apiFetch<{ data: { orders: Order[] } }>("/orders?limit=1");
          if (!ok) throw new Error(body.message || "Couldn't load your orders.");
          const latest = body.data.orders?.[0];
          if (!latest) { if (!cancelled) { setError("You don't have any orders yet."); setLoading(false); } return; }
          orderId = latest.orderId;
        }

        const { ok, body } = await apiFetch<{ data: { order: Order } }>(`/orders/${orderId}`);
        if (cancelled) return;
        if (!ok) throw new Error(body.message || "Order not found.");
        setOrder(body.data.order);

        // Live courier info is best-effort — Eshopbox may not be configured
        // in this environment, or the order may not be handed off yet, so a
        // failure here just means the courier card stays hidden.
        apiFetch<{ data: { tracking: Tracking } }>(`/integrations/shipping/track/${orderId}`)
          .then(({ ok: trackOk, body: trackBody }) => {
            if (!cancelled && trackOk && trackBody.data?.tracking) setCourier(trackBody.data.tracking);
          })
          .catch(() => {});
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [orderIdParam]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.cream, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI','Helvetica Neue',sans-serif", color: C.textLight, fontSize: 14 }}>
        Loading tracking info…
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ minHeight: "100vh", background: C.cream, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI','Helvetica Neue',sans-serif", gap: 10 }}>
        <div style={{ fontSize: 40 }}>📦</div>
        <div style={{ fontSize: 15, color: C.textMid, fontWeight: 600 }}>{error || "Order not found."}</div>
        <Link href="/account" style={{ fontSize: 13, color: C.saffron, fontWeight: 700, textDecoration: "none" }}>Go to My Orders →</Link>
      </div>
    );
  }

  const idx = currentIndex(order.status);
  const isException = EXCEPTION_STATUSES.includes(order.status);
  const total = order.total;
  const address = order.addressId; // populated Address doc (see order.routes.ts GET /:orderId)

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'Segoe UI','Helvetica Neue',sans-serif" }}>
      <nav style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <span style={{ fontSize: 20 }}>🪔</span>
            <span style={{ fontFamily: "'Georgia',serif", fontWeight: 700, fontSize: 16, color: C.saffron }}>nityasamagri</span>
          </Link>
          <Link href="/account" style={{ fontSize: 13, color: C.textMid, textDecoration: "none", fontWeight: 600 }}>My Account →</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: C.textLight, marginBottom: 4 }}>Tracking Order</div>
            <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 26, color: C.text, margin: 0 }}>#{order.orderId}</h1>
            <div style={{ fontSize: 13, color: C.textLight, marginTop: 4 }}>
              Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
            </div>
          </div>
          {isException ? (
            <div style={{ background: C.redBg, border: `1px solid ${C.red}33`, borderRadius: 12, padding: "14px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: C.textLight, marginBottom: 2 }}>Status</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.red, textTransform: "capitalize" }}>{order.status}</div>
            </div>
          ) : (
            <div style={{ background: C.greenBg, border: `1px solid ${C.green}33`, borderRadius: 12, padding: "14px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: C.textLight, marginBottom: 2 }}>Current Status</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.green, textTransform: "capitalize" }}>{order.status.replace(/_/g, " ")}</div>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
          {/* Left — timeline */}
          <div>
            {!isException && (
              <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: "28px 32px", marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 24 }}>Delivery Status</div>
                {STAGES.map((s, i) => {
                  const done = i <= idx;
                  const isLast = i === STAGES.length - 1;
                  const event = order.timeline?.find((t: TimelineEvent) => t.status === s.key);
                  return (
                    <div key={s.key} style={{ display: "flex", gap: 16 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 16, flexShrink: 0,
                          background: done ? C.saffron : C.creamDark,
                          color: done ? C.white : C.textLight,
                          boxShadow: done && i === idx ? `0 0 0 3px ${C.saffron}33` : "none",
                        }}>{done ? s.icon : "○"}</div>
                        {!isLast && <div style={{ width: 2, flex: 1, minHeight: 32, background: i < idx ? C.saffron : C.creamDark, margin: "4px 0" }} />}
                      </div>
                      <div style={{ paddingBottom: isLast ? 0 : 28 }}>
                        <div style={{ fontWeight: done ? 700 : 500, fontSize: 14, color: done ? C.text : C.textLight }}>{s.label}</div>
                        <div style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>
                          {event ? new Date(event.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : (i === idx ? "In progress" : "")}
                        </div>
                        {i === idx && (
                          <div style={{ marginTop: 8, display: "inline-block", background: C.saffronBg, color: C.saffron, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>
                            Current Status
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {courier && (
              <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.blueBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🛵</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{courier.courierName || "Courier assigned"}</div>
                    <div style={{ fontSize: 12, color: C.textLight }}>{courier.awb ? `AWB ${courier.awb}` : ""}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right — order + address */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {address && (
              <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: "20px 22px" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>📍 Delivery Address</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{address.fullName}</div>
                <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>{address.line1}{address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} — {address.pincode}</div>
                <div style={{ fontSize: 12, color: C.textLight, marginTop: 6 }}>📞 {address.phone}</div>
              </div>
            )}

            <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: "20px 22px" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>📦 Items ({order.items?.length || 0})</div>
              {(order.items || []).map((i: OrderItem, idx2: number) => (
                <div key={idx2} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, fontSize: 13 }}>
                  <div>
                    <div style={{ color: C.text, fontWeight: 500 }}>{i.productName}</div>
                    <div style={{ fontSize: 11, color: C.textLight }}>Qty {i.qty}</div>
                  </div>
                  <span style={{ fontWeight: 700, color: C.text }}>₹{(i.price * i.qty).toLocaleString()}</span>
                </div>
              ))}
              <div style={{ borderTop: `1.5px dashed ${C.border}`, marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: C.saffron }}>
                <span>Total</span><span>₹{total.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ background: C.saffronBg, borderRadius: 16, padding: "16px 20px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6 }}>Need help with this order?</div>
              <div style={{ fontSize: 12, color: C.textMid, marginBottom: 12 }}>Report a delay, damaged item, or ask a question.</div>
              <a href={`mailto:support@nityasamagri.in?subject=Help with order ${order.orderId}`} style={{ display: "block", textAlign: "center", width: "100%", padding: "10px", borderRadius: 9, background: C.saffron, color: C.white, border: "none", fontWeight: 700, fontSize: 12, textDecoration: "none", boxSizing: "border-box" }}>
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}