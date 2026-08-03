import { useState } from "react";
 
const C = {
  saffron: "#E8560A",
  saffronBg: "#FFF3EC",
  saffronDark: "#B8400A",
  marigold: "#F5A623",
  marigoldLight: "#FAC65A",
  cream: "#FFF8EE",
  creamDark: "#F0E4CE",
  bark: "#5C3317",
  barkLight: "#7A4A28",
  text: "#2C1A0E",
  textMid: "#5C3D20",
  textLight: "#9A7050",
  white: "#FFFFFF",
  green: "#1A7A3C",
  greenBg: "#EDFAF3",
  border: "#E8D8BC",
  gold: "#C8860A",
  goldBg: "#FFFBE8",
  blue: "#1A5C9E",
  blueBg: "#EEF4FF",
  red: "#C0392B",
  redBg: "#FFF0EE",
  purple: "#6B2EA8",
  purpleBg: "#F5EEFF",
};
 
const user = {
  name: "Rahul Sharma",
  email: "rahul.sharma@gmail.com",
  phone: "+91 98765 43210",
  joined: "March 2024",
  avatar: "R",
  tier: "Gold",
  points: 2450,
  totalOrders: 18,
  totalSpend: 14820,
  savedAddresses: 3,
};
 
const orders = [
  {
    id: "#ORD-2026-1842", date: "28 May 2026", status: "Delivered", amount: 798,
    items: [{ name: "Pure Cow Ghee 500ml", qty: 2, price: 299, icon: "🫙" }, { name: "Camphor Tablets 50g", qty: 1, price: 65, icon: "⚪" }],
    payment: "UPI", courier: "Delhivery", tracking: "DL2026182734",
    timeline: [
      { label: "Order Placed", date: "28 May, 10:30 AM", done: true },
      { label: "Confirmed", date: "28 May, 10:32 AM", done: true },
      { label: "Packed", date: "28 May, 1:15 PM", done: true },
      { label: "Shipped", date: "28 May, 4:00 PM", done: true },
      { label: "Delivered", date: "29 May, 11:20 AM", done: true },
    ],
    canReturn: true, canReview: true,
  },
  {
    id: "#ORD-2026-1791", date: "20 May 2026", status: "Shipped", amount: 1249,
    items: [{ name: "Hawan Samagri Kit", qty: 1, price: 499, icon: "🪔" }, { name: "Copper Kalash", qty: 1, price: 399, icon: "🏺" }, { name: "Tulsi Mala 108 Beads", qty: 1, price: 149, icon: "📿" }],
    payment: "Razorpay", courier: "Shiprocket", tracking: "SR2026179182",
    timeline: [
      { label: "Order Placed", date: "20 May, 9:00 AM", done: true },
      { label: "Confirmed", date: "20 May, 9:05 AM", done: true },
      { label: "Packed", date: "20 May, 3:30 PM", done: true },
      { label: "Shipped", date: "21 May, 8:00 AM", done: true },
      { label: "Delivered", date: "", done: false },
    ],
    canReturn: false, canReview: false,
  },
  {
    id: "#ORD-2026-1650", date: "8 May 2026", status: "Delivered", amount: 499,
    items: [{ name: "Navratri Puja Kit", qty: 1, price: 499, icon: "🪷" }],
    payment: "COD", courier: "DTDC", tracking: "DT2026165034",
    timeline: [
      { label: "Order Placed", date: "8 May, 6:45 PM", done: true },
      { label: "Confirmed", date: "8 May, 7:00 PM", done: true },
      { label: "Packed", date: "9 May, 10:00 AM", done: true },
      { label: "Shipped", date: "9 May, 2:00 PM", done: true },
      { label: "Delivered", date: "11 May, 12:30 PM", done: true },
    ],
    canReturn: false, canReview: true,
  },
  {
    id: "#ORD-2026-1412", date: "15 Apr 2026", status: "Cancelled", amount: 349,
    items: [{ name: "Rudrabhishek Kit", qty: 1, price: 349, icon: "🪬" }],
    payment: "UPI", courier: "—", tracking: "—",
    timeline: [
      { label: "Order Placed", date: "15 Apr, 11:00 AM", done: true },
      { label: "Cancelled", date: "15 Apr, 11:45 AM", done: true },
    ],
    canReturn: false, canReview: false,
  },
];
 
const bookings = [
  {
    id: "#BK-2026-0847", date: "15 Jun 2026", status: "Confirmed",
    pandit: "Pt. Ramesh Sharma", ceremony: "Griha Pravesh",
    time: "10:00 AM", address: "B-204 Vasant Kunj, New Delhi",
    amount: 3799, panditIcon: "🧘",
  },
  {
    id: "#BK-2026-0612", date: "2 May 2026", status: "Completed",
    pandit: "Pt. Suresh Mishra", ceremony: "Satyanarayan Katha",
    time: "08:00 AM", address: "B-204 Vasant Kunj, New Delhi",
    amount: 2500, panditIcon: "🙏",
  },
  {
    id: "#BK-2026-0401", date: "12 Mar 2026", status: "Completed",
    pandit: "Pt. Ramesh Sharma", ceremony: "Navgrah Shanti Havan",
    time: "09:00 AM", address: "Temple Road, Saket, New Delhi",
    amount: 4500, panditIcon: "🧘",
  },
];
 
const wishlist = [
  { id: 1, name: "Pure Cow Ghee 1L", price: 549, mrp: 649, icon: "🫙", inStock: true },
  { id: 2, name: "Brass Puja Thali Set", price: 799, mrp: 999, icon: "🪙", inStock: true },
  { id: 3, name: "Rudraksha 5 Mukhi Mala", price: 349, mrp: 499, icon: "📿", inStock: false },
  { id: 4, name: "Navratri Complete Kit", price: 1299, mrp: 1599, icon: "🪷", inStock: true },
];
 
const addresses = [
  { id: 1, label: "Home", name: "Rahul Sharma", line1: "B-204, Palam Vihar", line2: "Vasant Kunj", city: "New Delhi", state: "Delhi", pin: "110070", phone: "+91 98765 43210", isDefault: true },
  { id: 2, label: "Office", name: "Rahul Sharma", line1: "Plot 12, Sector 44", line2: "Cyber City", city: "Gurgaon", state: "Haryana", pin: "122003", phone: "+91 98765 43210", isDefault: false },
  { id: 3, label: "Temple", name: "Sharma Family", line1: "Shiv Mandir Lane", line2: "Saket", city: "New Delhi", state: "Delhi", pin: "110017", phone: "+91 98765 43210", isDefault: false },
];
 
const rewardHistory = [
  { desc: "Order #ORD-2026-1842", type: "earned", pts: +80, date: "28 May 2026" },
  { desc: "Order #ORD-2026-1791", type: "earned", pts: +125, date: "20 May 2026" },
  { desc: "Redeemed on Order #ORD-2026-1650", type: "redeemed", pts: -200, date: "8 May 2026" },
  { desc: "Order #ORD-2026-1650", type: "earned", pts: +50, date: "8 May 2026" },
  { desc: "Welcome Bonus", type: "earned", pts: +100, date: "10 Mar 2024" },
];
 
const STATUS_STYLE = {
  Delivered:  { bg: C.greenBg,  color: C.green,  dot: C.green  },
  Shipped:    { bg: C.blueBg,   color: C.blue,   dot: C.blue   },
  Confirmed:  { bg: C.goldBg,   color: C.gold,   dot: C.gold   },
  Cancelled:  { bg: C.redBg,    color: C.red,    dot: C.red    },
  Completed:  { bg: C.greenBg,  color: C.green,  dot: C.green  },
  Pending:    { bg: C.saffronBg,color: C.saffron,dot: C.saffron},
};
 
function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.Pending;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}
 
function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
      <div>
        <h2 style={{ fontFamily: "'Georgia',serif", fontSize: 22, color: C.text, margin: "0 0 4px" }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 13, color: C.textLight, margin: 0 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
 
// ─── VIEWS ───────────────────────────────────────────────────────────────────
 
function OverviewView({ setView }) {
  return (
    <div>
      {/* Welcome banner */}
      <div style={{ background: `linear-gradient(135deg, ${C.bark} 0%, ${C.barkLight} 100%)`, borderRadius: 20, padding: "28px 32px", marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, color: C.marigoldLight, fontWeight: 600, marginBottom: 6 }}>Welcome back 🙏</div>
          <div style={{ fontFamily: "'Georgia',serif", fontSize: 24, color: C.white, fontWeight: 700, marginBottom: 4 }}>{user.name}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{user.email} · Member since {user.joined}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 14, padding: "14px 20px", backdropFilter: "blur(8px)" }}>
            <div style={{ fontSize: 11, color: C.marigoldLight, fontWeight: 600, marginBottom: 4 }}>🏅 {user.tier} Member</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.white }}>{user.points.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Reward Points</div>
          </div>
        </div>
      </div>
 
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Orders", value: user.totalOrders, icon: "📦", color: C.saffron, bg: C.saffronBg, action: () => setView("orders") },
          { label: "Total Spent", value: `₹${user.totalSpend.toLocaleString()}`, icon: "💰", color: C.gold, bg: C.goldBg, action: null },
          { label: "Pandit Bookings", value: bookings.length, icon: "🙏", color: C.purple, bg: C.purpleBg, action: () => setView("bookings") },
          { label: "Wishlist Items", value: wishlist.length, icon: "❤️", color: C.red, bg: C.redBg, action: () => setView("wishlist") },
        ].map(s => (
          <div key={s.label} onClick={s.action} style={{ background: s.bg, borderRadius: 14, padding: "18px 20px", border: `1px solid ${s.color}22`, cursor: s.action ? "pointer" : "default", transition: "transform 0.15s" }}
            onMouseEnter={e => s.action && (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{s.value}</div>
            <div style={{ fontSize: 12, color: C.textLight }}>{s.label}</div>
          </div>
        ))}
      </div>
 
      {/* Recent orders */}
      <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: "24px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ fontFamily: "'Georgia',serif", fontSize: 18, color: C.text, margin: 0 }}>Recent Orders</h3>
          <button onClick={() => setView("orders")} style={{ border: "none", background: "transparent", color: C.saffron, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>View all →</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {orders.slice(0, 3).map(o => (
            <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 14px", background: C.cream, borderRadius: 10 }}>
              <span style={{ fontSize: 20 }}>{o.items[0].icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{o.id}</div>
                <div style={{ fontSize: 12, color: C.textLight }}>{o.date} · {o.items.length} item{o.items.length > 1 ? "s" : ""}</div>
              </div>
              <StatusBadge status={o.status} />
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>₹{o.amount}</span>
            </div>
          ))}
        </div>
      </div>
 
      {/* Upcoming booking */}
      {bookings.find(b => b.status === "Confirmed") && (
        <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: "24px" }}>
          <h3 style={{ fontFamily: "'Georgia',serif", fontSize: 18, color: C.text, margin: "0 0 16px" }}>Upcoming Booking</h3>
          {(() => { const b = bookings.find(b => b.status === "Confirmed"); return (
            <div style={{ background: C.saffronBg, borderRadius: 12, padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <span style={{ fontSize: 32 }}>{b.panditIcon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{b.ceremony}</div>
                  <div style={{ fontSize: 12, color: C.textLight }}>{b.pandit} · {b.date} at {b.time}</div>
                  <div style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>📍 {b.address}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <StatusBadge status={b.status} />
                <div style={{ fontSize: 14, fontWeight: 700, color: C.saffron, marginTop: 6 }}>₹{b.amount.toLocaleString()}</div>
              </div>
            </div>
          ); })()}
        </div>
      )}
    </div>
  );
}
 
function OrdersView() {
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Delivered", "Shipped", "Cancelled"];
  const filtered = filter === "All" ? orders : orders.filter(o => o.status === filter);
 
  return (
    <div>
      <SectionHeader title="My Orders" subtitle={`${user.totalOrders} orders placed since ${user.joined}`} />
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 16px", borderRadius: 999, border: `1.5px solid ${filter === f ? C.saffron : C.border}`, background: filter === f ? C.saffron : C.white, color: filter === f ? C.white : C.textMid, fontWeight: 600, fontSize: 12, cursor: "pointer", transition: "all 0.15s" }}>{f}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {filtered.map(o => (
          <div key={o.id} style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            {/* Order header */}
            <div style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}
              onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{o.id}</span>
                  <StatusBadge status={o.status} />
                </div>
                <div style={{ fontSize: 12, color: C.textLight }}>{o.date} · {o.items.length} item{o.items.length > 1 ? "s" : ""} · Paid via {o.payment}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>₹{o.amount}</div>
                <div style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>{expanded === o.id ? "▲ Hide" : "▼ Details"}</div>
              </div>
            </div>
 
            {/* Items preview */}
            <div style={{ padding: "0 20px 16px", borderTop: `1px solid ${C.creamDark}`, paddingTop: 14 }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                {o.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: C.cream, borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, color: C.text }}>{item.name}</div>
                      <div style={{ color: C.textLight }}>Qty: {item.qty} · ₹{item.price}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {o.status === "Delivered" && <button style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, color: C.textMid, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>🔄 Reorder</button>}
                {o.canReview && <button style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, color: C.textMid, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>⭐ Write Review</button>}
                {o.canReturn && <button style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${C.redBg}`, background: C.redBg, color: C.red, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>↩ Return</button>}
                <button style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, color: C.textMid, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>📄 Invoice</button>
                {o.status === "Shipped" && <button style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${C.blueBg}`, background: C.blueBg, color: C.blue, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>🚚 Track</button>}
              </div>
            </div>
 
            {/* Expanded: timeline + tracking */}
            {expanded === o.id && (
              <div style={{ background: C.cream, borderTop: `1px solid ${C.border}`, padding: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                  {/* Timeline */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.textMid, marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.8 }}>Order Timeline</div>
                    {o.timeline.map((t, i) => (
                      <div key={i} style={{ display: "flex", gap: 12, marginBottom: i < o.timeline.length - 1 ? 0 : 0 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{ width: 14, height: 14, borderRadius: "50%", background: t.done ? C.green : C.creamDark, border: `2px solid ${t.done ? C.green : C.border}`, flexShrink: 0, marginTop: 2 }} />
                          {i < o.timeline.length - 1 && <div style={{ width: 2, flex: 1, background: t.done ? C.green : C.border, minHeight: 20, margin: "2px 0" }} />}
                        </div>
                        <div style={{ paddingBottom: 16 }}>
                          <div style={{ fontSize: 13, fontWeight: t.done ? 600 : 400, color: t.done ? C.text : C.textLight }}>{t.label}</div>
                          {t.date && <div style={{ fontSize: 11, color: C.textLight, marginTop: 2 }}>{t.date}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Tracking */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.textMid, marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.8 }}>Shipment Details</div>
                    {[["Courier", o.courier], ["Tracking No.", o.tracking], ["Payment", o.payment]].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13 }}>
                        <span style={{ color: C.textLight }}>{k}</span>
                        <span style={{ fontWeight: 600, color: C.text }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
 
function BookingsView() {
  return (
    <div>
      <SectionHeader title="My Pandit Bookings" subtitle={`${bookings.length} ceremonies booked`}
        action={<button style={{ padding: "9px 18px", borderRadius: 9, background: C.saffron, color: C.white, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>+ New Booking</button>} />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {bookings.map(b => (
          <div key={b.id} style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: "20px 24px" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.cream, border: `2px solid ${C.marigoldLight}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>{b.panditIcon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 2 }}>{b.ceremony}</div>
                    <div style={{ fontSize: 13, color: C.textLight }}>{b.pandit}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <StatusBadge status={b.status} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.saffron, marginTop: 6 }}>₹{b.amount.toLocaleString()}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13, color: C.textLight, marginBottom: 14 }}>
                  <span>📅 {b.date}</span>
                  <span>⏰ {b.time}</span>
                  <span>📍 {b.address}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {b.status === "Confirmed" && <>
                    <button style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, color: C.textMid, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>🔁 Reschedule</button>
                    <button style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${C.redBg}`, background: C.redBg, color: C.red, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>✕ Cancel</button>
                  </>}
                  {b.status === "Completed" && <>
                    <button style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, color: C.textMid, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>⭐ Rate Pandit</button>
                    <button style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${C.saffronBg}`, background: C.saffronBg, color: C.saffron, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>🔄 Book Again</button>
                  </>}
                  <button style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, color: C.textMid, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>📋 View Details</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
 
function WishlistView() {
  const [items, setItems] = useState(wishlist);
  const remove = (id) => setItems(i => i.filter(x => x.id !== id));
  return (
    <div>
      <SectionHeader title="My Wishlist" subtitle={`${items.length} items saved`} />
      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: C.textLight }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🤍</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 6 }}>Your wishlist is empty</div>
          <div style={{ fontSize: 13 }}>Save items you love for later</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
          {items.map(item => {
            const disc = Math.round(((item.mrp - item.price) / item.mrp) * 100);
            return (
              <div key={item.id} style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 60, height: 60, background: C.cream, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 4 }}>{item.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 16, color: C.text }}>₹{item.price}</span>
                    <span style={{ fontSize: 12, color: C.textLight, textDecoration: "line-through" }}>₹{item.mrp}</span>
                    <span style={{ fontSize: 10, color: C.green, fontWeight: 700 }}>{disc}% off</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button disabled={!item.inStock} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: item.inStock ? C.saffron : C.creamDark, color: item.inStock ? C.white : C.textLight, fontWeight: 600, fontSize: 12, cursor: item.inStock ? "pointer" : "not-allowed" }}>
                      {item.inStock ? "🛒 Add to Cart" : "Out of Stock"}
                    </button>
                    <button onClick={() => remove(item.id)} style={{ padding: "7px 10px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, color: C.red, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>✕</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
 
function AddressesView() {
  return (
    <div>
      <SectionHeader title="Saved Addresses" subtitle={`${addresses.length} addresses saved`}
        action={<button style={{ padding: "9px 18px", borderRadius: 9, background: C.saffron, color: C.white, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>+ Add Address</button>} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {addresses.map(a => (
          <div key={a.id} style={{ background: C.white, borderRadius: 14, border: `2px solid ${a.isDefault ? C.saffron : C.border}`, padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.saffron, background: C.saffronBg, padding: "3px 10px", borderRadius: 999 }}>{a.label}</span>
                {a.isDefault && <span style={{ fontSize: 11, fontWeight: 700, color: C.green, background: C.greenBg, padding: "3px 10px", borderRadius: 999 }}>✓ Default</span>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ padding: "6px 12px", borderRadius: 7, border: `1.5px solid ${C.border}`, background: C.white, color: C.textMid, fontWeight: 600, fontSize: 11, cursor: "pointer" }}>Edit</button>
                {!a.isDefault && <button style={{ padding: "6px 12px", borderRadius: 7, border: `1.5px solid ${C.redBg}`, background: C.redBg, color: C.red, fontWeight: 600, fontSize: 11, cursor: "pointer" }}>Delete</button>}
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 4 }}>{a.name}</div>
            <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.7 }}>{a.line1}, {a.line2}, {a.city}, {a.state} — {a.pin}</div>
            <div style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>📞 {a.phone}</div>
            {!a.isDefault && <button style={{ marginTop: 12, padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.cream, color: C.textMid, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Set as Default</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
 
function RewardsView() {
  const nextTier = { tier: "Platinum", required: 50000, current: user.totalSpend };
  const pct = Math.min(100, Math.round((nextTier.current / nextTier.required) * 100));
  return (
    <div>
      <SectionHeader title="Loyalty & Rewards" subtitle="Earn points on every order. Redeem for discounts." />
      {/* Points card */}
      <div style={{ background: `linear-gradient(135deg, ${C.gold} 0%, ${C.marigold} 100%)`, borderRadius: 20, padding: "28px 32px", marginBottom: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 600, marginBottom: 6 }}>Available Points</div>
          <div style={{ fontSize: 48, fontWeight: 700, color: C.white, lineHeight: 1 }}>{user.points.toLocaleString()}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>= ₹{Math.floor(user.points / 10)} discount value</div>
          <button style={{ marginTop: 16, padding: "10px 20px", borderRadius: 10, background: C.white, color: C.gold, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Redeem Points</button>
        </div>
        <div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 600, marginBottom: 8 }}>🏅 {user.tier} Member</div>
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 8, height: 8, marginBottom: 8, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: C.white, borderRadius: 8 }} />
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>₹{nextTier.current.toLocaleString()} / ₹{nextTier.required.toLocaleString()} to {nextTier.tier}</div>
          <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
            {[["Silver","₹5,000",true],["Gold","₹15,000",true],["Platinum","₹50,000",false]].map(([t,req,done]) => (
              <div key={t} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16 }}>{done ? "✅" : "⬜"}</div>
                <div style={{ fontSize: 10, color: C.white, fontWeight: 600 }}>{t}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)" }}>{req}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
 
      {/* Rules */}
      <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "20px 24px", marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 14px" }}>How to Earn & Redeem</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[["🛒","Every ₹100 spent","= 10 points"],["🎁","Welcome bonus","100 points"],["📣","Refer a friend","50 points each"],["💸","100 points","= ₹10 off"]].map(([icon,k,v]) => (
            <div key={k} style={{ display: "flex", gap: 10, padding: "10px 14px", background: C.cream, borderRadius: 10 }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <div><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{k}</div><div style={{ fontSize: 12, color: C.textLight }}>{v}</div></div>
            </div>
          ))}
        </div>
      </div>
 
      {/* History */}
      <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "20px 24px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 14px" }}>Points History</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rewardHistory.map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: C.cream, borderRadius: 10, fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 600, color: C.text }}>{r.desc}</div>
                <div style={{ fontSize: 11, color: C.textLight, marginTop: 2 }}>{r.date}</div>
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: r.type === "earned" ? C.green : C.red }}>
                {r.type === "earned" ? "+" : ""}{r.pts}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
 
function ProfileView() {
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone, dob: "15 Mar 1990", gender: "Male" });
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div>
      <SectionHeader title="My Profile" subtitle="Manage your account details" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        <div>
          {/* Avatar */}
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 28, background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "20px" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg, ${C.saffron}, ${C.marigold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, color: C.white, flexShrink: 0 }}>{user.avatar}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{form.name}</div>
              <div style={{ fontSize: 12, color: C.textLight, marginBottom: 8 }}>Member since {user.joined}</div>
              <button style={{ padding: "6px 14px", borderRadius: 7, border: `1.5px solid ${C.border}`, background: C.white, color: C.textMid, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Change Photo</button>
            </div>
          </div>
 
          {/* Form */}
          <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[{label:"Full Name",key:"name",type:"text"},{label:"Email Address",key:"email",type:"email"},{label:"Mobile Number",key:"phone",type:"tel"},{label:"Date of Birth",key:"dob",type:"text"},{label:"Gender",key:"gender",type:"text"}].map(f => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textMid, marginBottom: 6 }}>{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={e => setForm(v => ({...v, [f.key]: e.target.value}))} style={{ width: "100%", padding: "10px 14px", borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text, background: C.cream, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
              <button onClick={save} style={{ padding: "12px 0", borderRadius: 10, border: "none", background: saved ? C.bark : C.saffron, color: C.white, fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "background 0.3s" }}>
                {saved ? "✓ Changes Saved" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
 
        {/* Security + preferences */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "20px 24px" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 14px" }}>🔒 Security</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["Change Password", "Update Mobile OTP", "Manage Login Sessions"].map(item => (
                <button key={item} style={{ padding: "11px 14px", borderRadius: 9, border: `1.5px solid ${C.border}`, background: C.cream, color: C.textMid, fontWeight: 500, fontSize: 13, cursor: "pointer", textAlign: "left" }}>{item} →</button>
              ))}
            </div>
          </div>
          <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "20px 24px" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 14px" }}>🔔 Notification Preferences</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[["Order Updates","SMS & WhatsApp",true],["Festival Offers","Email & SMS",true],["New Pandit Alerts","Email",false],["Review Reminders","Email",true]].map(([name, channel, on]) => (
                <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: C.cream, borderRadius: 9 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{name}</div>
                    <div style={{ fontSize: 11, color: C.textLight }}>{channel}</div>
                  </div>
                  <div style={{ width: 36, height: 20, borderRadius: 10, background: on ? C.saffron : C.creamDark, position: "relative", cursor: "pointer" }}>
                    <div style={{ position: "absolute", top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: C.white, transition: "left 0.2s" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: C.redBg, borderRadius: 14, border: `1px solid ${C.red}22`, padding: "16px 20px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.red, marginBottom: 6 }}>⚠️ Danger Zone</div>
            <button style={{ padding: "8px 16px", borderRadius: 8, border: `1.5px solid ${C.red}`, background: "transparent", color: C.red, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Delete My Account</button>
          </div>
        </div>
      </div>
    </div>
  );
}
 
// ─── NAV ──────────────────────────────────────────────────────────────────────
const NAV = [
  { id: "overview",  label: "Overview",         icon: "🏠" },
  { id: "orders",    label: "My Orders",         icon: "📦" },
  { id: "bookings",  label: "Pandit Bookings",   icon: "🙏" },
  { id: "wishlist",  label: "Wishlist",          icon: "❤️" },
  { id: "addresses", label: "Addresses",         icon: "📍" },
  { id: "rewards",   label: "Rewards",           icon: "🏅" },
  { id: "profile",   label: "Profile & Settings",icon: "👤" },
];
 
export default function CustomerAccount() {
  const [view, setView] = useState("overview");
  const active = NAV.find(n => n.id === view);
 
  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'Segoe UI','Helvetica Neue',sans-serif" }}>
      {/* Topbar */}
      <nav style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🪔</span>
            <span style={{ fontFamily: "'Georgia',serif", fontWeight: 700, fontSize: 16, color: C.saffron }}>nityasamagri</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${C.saffron}, ${C.marigold})`, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontWeight: 700, fontSize: 14 }}>{user.avatar}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{user.name}</div>
              <div style={{ fontSize: 11, color: C.textLight }}>🏅 {user.tier} Member</div>
            </div>
          </div>
        </div>
      </nav>
 
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "240px 1fr", gap: 28 }}>
        {/* Sidebar */}
        <div>
          {/* Profile mini card */}
          <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: "20px", marginBottom: 12, textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg, ${C.saffron}, ${C.marigold})`, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontWeight: 700, fontSize: 22, margin: "0 auto 10px" }}>{user.avatar}</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{user.name}</div>
            <div style={{ fontSize: 11, color: C.textLight, marginBottom: 8 }}>Member since {user.joined}</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: C.goldBg, color: C.gold, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>🏅 {user.tier} · {user.points.toLocaleString()} pts</div>
          </div>
          {/* Nav items */}
          <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            {NAV.map((item, i) => (
              <button key={item.id} onClick={() => setView(item.id)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 16px",
                border: "none", borderBottom: i < NAV.length - 1 ? `1px solid ${C.creamDark}` : "none",
                background: view === item.id ? C.saffronBg : C.white,
                color: view === item.id ? C.saffron : C.textMid,
                fontWeight: view === item.id ? 700 : 400,
                fontSize: 13, cursor: "pointer", textAlign: "left", transition: "background 0.15s",
                borderLeft: `3px solid ${view === item.id ? C.saffron : "transparent"}`,
              }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
          <button style={{ width: "100%", marginTop: 12, padding: "12px", borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.white, color: C.red, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Sign Out
          </button>
        </div>
 
        {/* Main content */}
        <div>
          {view === "overview"  && <OverviewView setView={setView} />}
          {view === "orders"    && <OrdersView />}
          {view === "bookings"  && <BookingsView />}
          {view === "wishlist"  && <WishlistView />}
          {view === "addresses" && <AddressesView />}
          {view === "rewards"   && <RewardsView />}
          {view === "profile"   && <ProfileView />}
        </div>
      </div>
    </div>
  );
}
