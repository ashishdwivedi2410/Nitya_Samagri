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
  gold: "#C8860A", goldBg: "#FFFBE8",
  blue: "#1A5C9E", blueBg: "#EEF4FF",
  red: "#C0392B", redBg: "#FFF0EE",
};

const INIT_NOTIFICATIONS = [
  { id: "n1", type: "order",   icon: "🛵", title: "Out for delivery",         message: "Your order #ORD-2026-1999 is out for delivery, arriving today.", time: "2h ago",    read: false },
  { id: "n2", type: "offer",   icon: "🎉", title: "Flash sale: 20% off",      message: "DIWALI20 is live — 20% off on all festival kits, today only.",   time: "5h ago",    read: false },
  { id: "n3", type: "order",   icon: "📦", title: "Order shipped",           message: "Your order #ORD-2026-1999 has shipped via Delhivery.",          time: "Yesterday", read: true  },
  { id: "n4", type: "account", icon: "🔒", title: "New login detected",       message: "Your account was accessed from a new device in Delhi.",        time: "Yesterday", read: true  },
  { id: "n5", type: "order",   icon: "✅", title: "Order delivered",         message: "Order #ORD-2026-1842 was delivered. Loved it? Leave a review.",  time: "3 days ago",read: true  },
  { id: "n6", type: "offer",   icon: "🪔", title: "Navratri kits are live",   message: "Shop curated Navratri puja kits, starting at ₹499.",            time: "5 days ago",read: true  },
  { id: "n7", type: "account", icon: "🎁", title: "Welcome to nityasamagri", message: "Your account was created successfully. Explore puja essentials.",time: "1 week ago",read: true  },
];

const FILTERS = [
  { key: "all",     label: "All" },
  { key: "order",   label: "Orders" },
  { key: "offer",   label: "Offers" },
  { key: "account", label: "Account" },
];

const typeColor = {
  order:   { fg: C.blue,    bg: C.blueBg },
  offer:   { fg: C.gold,    bg: C.goldBg },
  account: { fg: C.saffron, bg: C.saffronBg },
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(INIT_NOTIFICATIONS);
  const [filter, setFilter] = useState("all");

  const visible = filter === "all" ? notifs : notifs.filter(n => n.type === filter);
  const unreadCount = notifs.filter(n => !n.read).length;

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const toggleRead = (id: string) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  const clearAll = () => setNotifs([]);

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'Segoe UI','Helvetica Neue',sans-serif" }}>
      {/* Navbar */}
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
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 26, color: C.text, margin: 0 }}>Notifications</h1>
            <div style={{ fontSize: 13, color: C.textLight, marginTop: 4 }}>
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "You're all caught up"}
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

        {/* Filters */}
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

        {/* List */}
        {visible.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.textLight }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔔</div>
            <div style={{ fontSize: 14 }}>No notifications here.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {visible.map(n => {
              const tc = typeColor[n.type as keyof typeof typeColor];
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
