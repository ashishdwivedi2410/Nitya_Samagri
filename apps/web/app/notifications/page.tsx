"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { connectNotifications, type WsMessage } from "../../lib/ws";
import { isLoggedIn } from "../../lib/auth";

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
  blue: "#1A5C9E", blueBg: "#EEF4FF",
  red: "#C0392B", redBg: "#FFF0EE",
};

type Notif = { id: string; type: string; icon: string; title: string; message: string; time: string; read: boolean };

const FILTERS = [
  { key: "all",     label: "All" },
  { key: "order",   label: "Orders" },
  { key: "payment", label: "Payments" },
  { key: "account", label: "Account" },
];

const typeColor: Record<string, { fg: string; bg: string }> = {
  order:   { fg: C.blue,    bg: C.blueBg },
  payment: { fg: C.gold,    bg: C.goldBg },
  account: { fg: C.saffron, bg: C.saffronBg },
};

// Maps the backend's WsEventType (backend/src/websocket/ws.server.ts) to
// how this page displays it. Real-time only — the backend has no REST
// endpoint for notification history, so nothing older than "since this
// page was opened" can be shown yet.
function toNotif(msg: WsMessage): Notif | null {
  const p = msg.payload as any;
  const base = { id: `${msg.event}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, time: "Just now", read: false };
  switch (msg.event) {
    case "ORDER_CONFIRMED":
      return { ...base, type: "order", icon: "✅", title: "Order confirmed", message: `Order ${p.orderId || ""} has been confirmed.` };
    case "ORDER_SHIPPED":
      return { ...base, type: "order", icon: "📦", title: "Order shipped", message: `Order ${p.orderId || ""} is on its way.` };
    case "ORDER_STATUS_UPDATE":
      return { ...base, type: "order", icon: "🛵", title: "Order update", message: `Order ${p.orderId || ""} status: ${p.status || "updated"}.` };
    case "ORDER_DELIVERED":
      return { ...base, type: "order", icon: "🏠", title: "Order delivered", message: `Order ${p.orderId || ""} was delivered.` };
    case "PAYMENT_SUCCESS":
      return { ...base, type: "payment", icon: "💰", title: "Payment successful", message: `Payment of ₹${p.amount ?? ""} was received.` };
    case "PAYMENT_FAILED":
      return { ...base, type: "payment", icon: "⚠️", title: "Payment failed", message: p.reason || "Your payment could not be processed." };
    case "BOOKING_CONFIRMED":
      return { ...base, type: "order", icon: "🙏", title: "Pandit booking confirmed", message: p.message || "Your pandit booking is confirmed." };
    case "BOOKING_CANCELLED":
      return { ...base, type: "order", icon: "❌", title: "Booking cancelled", message: p.message || "Your pandit booking was cancelled." };
    default:
      return null; // admin-only events (NEW_ORDER_ALERT, LOW_STOCK_ALERT) are ignored on the storefront
  }
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [filter, setFilter] = useState("all");
  const [status, setStatus] = useState<"connecting" | "open" | "error" | "closed">("connecting");
  const loggedIn = useRef(isLoggedIn());

  useEffect(() => {
    if (!loggedIn.current) { setStatus("error"); return; }
    const disconnect = connectNotifications(
      (msg) => {
        const n = toNotif(msg);
        if (n) setNotifs(prev => [n, ...prev]);
      },
      setStatus
    );
    return disconnect;
  }, []);

  const visible = filter === "all" ? notifs : notifs.filter(n => n.type === filter);
  const unreadCount = notifs.filter(n => !n.read).length;

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const toggleRead = (id: string) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  const clearAll = () => setNotifs([]);

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 26, color: C.text, margin: 0 }}>Notifications</h1>
            <div style={{ fontSize: 13, color: C.textLight, marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", display: "inline-block", background: status === "open" ? C.green : status === "connecting" ? C.gold : C.red }} />
              {status === "open" && (unreadCount > 0 ? `${unreadCount} unread` : "Live — you're all caught up")}
              {status === "connecting" && "Connecting…"}
              {status === "error" && !loggedIn.current && "Log in to see live notifications"}
              {status === "error" && loggedIn.current && "Couldn't connect — retry by reloading"}
              {status === "closed" && "Disconnected"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={markAllRead} disabled={unreadCount === 0} style={{
              padding: "9px 16px", borderRadius: 9, border: `1.5px solid ${C.border}`, background: C.white,
              color: unreadCount === 0 ? C.textLight : C.textMid, fontWeight: 600, fontSize: 12,
              cursor: unreadCount === 0 ? "default" : "pointer",
            }}>✓ Mark all read</button>
            <button onClick={clearAll} disabled={notifs.length === 0} style={{
              padding: "9px 16px", borderRadius: 9, border: `1.5px solid ${C.redBg}`, background: C.redBg,
              color: C.red, fontWeight: 600, fontSize: 12, cursor: notifs.length === 0 ? "default" : "pointer",
              opacity: notifs.length === 0 ? 0.5 : 1,
            }}>Clear all</button>
          </div>
        </div>

        <div style={{ background: C.goldBg, color: C.textMid, fontSize: 12, padding: "10px 14px", borderRadius: 10, marginBottom: 20 }}>
          These are live events only — the backend doesn't have a notification-history endpoint yet, so nothing from before this page was opened can be shown.
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {FILTERS.map(f => {
            const count = f.key === "all" ? notifs.length : notifs.filter(n => n.type === f.key).length;
            return (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: "8px 16px", borderRadius: 999, border: `1.5px solid ${filter === f.key ? C.saffron : C.border}`,
                background: filter === f.key ? C.saffronBg : C.white, color: filter === f.key ? C.saffron : C.textMid,
                fontWeight: 600, fontSize: 12, cursor: "pointer",
              }}>{f.label} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}</button>
            );
          })}
        </div>

        {visible.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.textLight }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔔</div>
            <div style={{ fontSize: 14 }}>
              {status === "open" ? "No notifications yet — you'll see updates here as they happen." : "Not connected."}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {visible.map(n => {
              const tc = typeColor[n.type] || typeColor.account;
              return (
                <div key={n.id} onClick={() => toggleRead(n.id)} style={{
                  background: n.read ? C.white : C.saffronBg,
                  border: `1px solid ${n.read ? C.border : C.saffron + "44"}`,
                  borderRadius: 14, padding: "16px 18px", display: "flex", gap: 14, cursor: "pointer",
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: tc.bg, color: tc.fg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {n.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ fontWeight: n.read ? 600 : 700, fontSize: 14, color: C.text }}>{n.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: C.textLight, whiteSpace: "nowrap" }}>{n.time}</span>
                        {!n.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.saffron, display: "inline-block" }} />}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: C.textMid, marginTop: 3, lineHeight: 1.5 }}>{n.message}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}