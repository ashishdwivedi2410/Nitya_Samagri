"use client";

import { useState } from "react";
import Link from "next/link";

const C = {
  saffron: "#E8560A", saffronBg: "#FFF3EC",
  marigold: "#F5A623", marigoldLight: "#FAC65A",
  cream: "#FFF8EE", creamDark: "#F0E4CE",
  bark: "#5C3317",
  text: "#2C1A0E", textMid: "#5C3D20", textLight: "#9A7050",
  white: "#FFFFFF",
  green: "#1A7A3C", greenBg: "#EDFAF3",
  border: "#E8D8BC",
  blue: "#1A5C9E", blueBg: "#EEF4FF",
  red: "#C0392B", redBg: "#FFF0EE",
};

const ORDER = {
  id: "#ORD-2026-1999",
  placedOn: "6 Aug 2026, 11:24 AM",
  expected: "9 Aug 2026",
  status: "out_for_delivery", // placed | confirmed | packed | shipped | out_for_delivery | delivered
  items: [
    { name: "Pure Cow Ghee 500ml", qty: 2, price: 299, icon: "🫙" },
    { name: "Hawan Samagri Kit", qty: 1, price: 499, icon: "🪔" },
    { name: "Tulsi Agarbatti Pack", qty: 1, price: 89, icon: "🕯️" },
  ],
  address: { name: "Rahul Sharma", line: "B-204, Palam Vihar, Vasant Kunj, New Delhi, Delhi — 110070", phone: "+91 98765 43210" },
  courier: { name: "Suresh Kumar", partner: "Shiprocket · Delhivery", phone: "+91 91234 56780", vehicle: "DL 4C AB 1234" },
};

const STAGES = [
  { key: "placed",            label: "Order Placed",     icon: "🧾", time: "6 Aug, 11:24 AM" },
  { key: "confirmed",         label: "Order Confirmed",  icon: "✅", time: "6 Aug, 11:40 AM" },
  { key: "packed",            label: "Packed",           icon: "📦", time: "6 Aug, 4:10 PM" },
  { key: "shipped",           label: "Shipped",          icon: "🚚", time: "7 Aug, 9:02 AM" },
  { key: "out_for_delivery",  label: "Out for Delivery", icon: "🛵", time: "9 Aug, 8:15 AM" },
  { key: "delivered",         label: "Delivered",        icon: "🏠", time: "Expected 9 Aug" },
];

function currentIndex(status) {
  return STAGES.findIndex(s => s.key === status);
}

export default function DeliveryTrackingPage() {
  const [order] = useState(ORDER);
  const idx = currentIndex(order.status);
  const total = order.items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'Segoe UI','Helvetica Neue',sans-serif" }}>
      {/* Navbar */}
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
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: C.textLight, marginBottom: 4 }}>Tracking Order</div>
            <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 26, color: C.text, margin: 0 }}>{order.id}</h1>
            <div style={{ fontSize: 13, color: C.textLight, marginTop: 4 }}>Placed on {order.placedOn}</div>
          </div>
          <div style={{ background: C.greenBg, border: `1px solid ${C.green}33`, borderRadius: 12, padding: "14px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: C.textLight, marginBottom: 2 }}>Expected Delivery</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.green }}>{order.expected}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
          {/* Left — timeline */}
          <div>
            <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: "28px 32px", marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 24 }}>Delivery Status</div>
              {STAGES.map((s, i) => {
                const done = i <= idx;
                const isLast = i === STAGES.length - 1;
                return (
                  <div key={s.key} style={{ display: "flex", gap: 16 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, flexShrink: 0,
                        background: done ? C.saffron : C.creamDark,
                        color: done ? C.white : C.textLight,
                        border: done && i === idx ? `3px solid ${C.saffronBg}` : "none",
                        boxShadow: done && i === idx ? `0 0 0 3px ${C.saffron}33` : "none",
                      }}>{done ? s.icon : "○"}</div>
                      {!isLast && <div style={{ width: 2, flex: 1, minHeight: 32, background: i < idx ? C.saffron : C.creamDark, margin: "4px 0" }} />}
                    </div>
                    <div style={{ paddingBottom: isLast ? 0 : 28 }}>
                      <div style={{ fontWeight: done ? 700 : 500, fontSize: 14, color: done ? C.text : C.textLight }}>{s.label}</div>
                      <div style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>{s.time}</div>
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

            {/* Courier card */}
            {(order.status === "shipped" || order.status === "out_for_delivery") && (
              <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.blueBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🛵</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{order.courier.name}</div>
                    <div style={{ fontSize: 12, color: C.textLight }}>{order.courier.partner} · {order.courier.vehicle}</div>
                  </div>
                </div>
                <a href={`tel:${order.courier.phone}`} style={{ padding: "9px 18px", borderRadius: 9, background: C.blue, color: C.white, fontWeight: 600, fontSize: 12, textDecoration: "none" }}>
                  📞 Call Delivery Partner
                </a>
              </div>
            )}
          </div>

          {/* Right — order + address */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: "20px 22px" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>📍 Delivery Address</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{order.address.name}</div>
              <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>{order.address.line}</div>
              <div style={{ fontSize: 12, color: C.textLight, marginTop: 6 }}>📞 {order.address.phone}</div>
            </div>

            <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: "20px 22px" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>📦 Items ({order.items.length})</div>
              {order.items.map(i => (
                <div key={i.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, fontSize: 13 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 16 }}>{i.icon}</span>
                    <div>
                      <div style={{ color: C.text, fontWeight: 500 }}>{i.name}</div>
                      <div style={{ fontSize: 11, color: C.textLight }}>Qty {i.qty}</div>
                    </div>
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
              <button style={{ width: "100%", padding: "10px", borderRadius: 9, background: C.saffron, color: C.white, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
