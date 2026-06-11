import { useState } from "react";
 
// ─── THEME ────────────────────────────────────────────────────────────────────
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
  purple: "#6B2EA8", purpleBg: "#F5EEFF",
};
 
// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const INIT_PRODUCT_CART = [
  { id: "p1", type: "product", name: "Pure Cow Ghee 500ml", variant: "500ml", price: 299, mrp: 349, qty: 2, icon: "🫙", category: "Ghee & Oils", gstPct: 5 },
  { id: "p2", type: "product", name: "Hawan Samagri Kit", variant: "Standard", price: 499, mrp: 649, qty: 1, icon: "🪔", category: "Hawan", gstPct: 5 },
  { id: "p3", type: "product", name: "Tulsi Agarbatti Pack", variant: "20 sticks", price: 89, mrp: 99, qty: 1, icon: "🕯️", category: "Sugandhit", gstPct: 12 },
];
 
const INIT_SERVICE_CART = [
  { id: "s1", type: "service", name: "Griha Pravesh Puja", pandit: "Pt. Ramesh Sharma", date: "15 Jun 2026", time: "10:00 AM", price: 3500, samagriKit: true, samagriPrice: 299, icon: "🏠", duration: "2-3 hrs" },
];
 
const SAVED_ADDRESSES = [
  { id: "a1", label: "Home", name: "Rahul Sharma", line1: "B-204, Palam Vihar", line2: "Vasant Kunj", city: "New Delhi", state: "Delhi", pin: "110070", phone: "+91 98765 43210", isDefault: true },
  { id: "a2", label: "Office", name: "Rahul Sharma", line1: "Plot 12, Sector 44", line2: "Cyber City", city: "Gurgaon", state: "Haryana", pin: "122003", phone: "+91 98765 43210", isDefault: false },
];
 
const COUPONS = {
  "DIWALI20": { type: "percent", value: 20, minOrder: 500, desc: "20% off (max ₹200)" },
  "FIRST100": { type: "flat", value: 100, minOrder: 300, desc: "₹100 off on first order" },
  "FREESHIP": { type: "shipping", value: 0, minOrder: 0, desc: "Free shipping" },
};
 
// ─── HELPERS ──────────────────────────────────────────────────────────────────
function calcProductTotals(items, coupon, shippingFree) {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const mrpTotal = items.reduce((s, i) => s + i.mrp * i.qty, 0);
  const savings = mrpTotal - subtotal;
  const gst = items.reduce((s, i) => s + (i.price * i.qty * i.gstPct) / 100, 0);
  const shipping = subtotal >= 499 || shippingFree ? 0 : 49;
  let discount = 0;
  if (coupon) {
    if (coupon.type === "percent") discount = Math.min(200, Math.round(subtotal * coupon.value / 100));
    else if (coupon.type === "flat") discount = coupon.value;
  }
  const total = Math.round(subtotal + gst + shipping - discount);
  return { subtotal, mrpTotal, savings, gst: Math.round(gst), shipping, discount, total };
}
 
function calcServiceTotal(items) {
  return items.reduce((s, i) => s + i.price + (i.samagriKit ? i.samagriPrice : 0), 0);
}
 
// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────
function Stepper({ steps, current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "20px 0" }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, flexShrink: 0,
              background: i < current ? C.green : i === current ? C.saffron : C.creamDark,
              color: i <= current ? C.white : C.textLight,
            }}>{i < current ? "✓" : i + 1}</div>
            <span style={{ fontSize: 12, fontWeight: i === current ? 700 : 400, color: i === current ? C.saffron : i < current ? C.green : C.textLight, whiteSpace: "nowrap" }}>{s}</span>
          </div>
          {i < steps.length - 1 && <div style={{ flex: 1, height: 2, margin: "0 12px", background: i < current ? C.green : C.creamDark, borderRadius: 1 }} />}
        </div>
      ))}
    </div>
  );
}
 
function SummaryRow({ label, value, bold, color, small }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: small ? 6 : 10, fontSize: small ? 12 : 13 }}>
      <span style={{ color: C.textLight }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 500, color: color || C.text }}>{value}</span>
    </div>
  );
}
 
function TabToggle({ tab, setTab }) {
  return (
    <div style={{ display: "flex", background: C.creamDark, borderRadius: 12, padding: 4, marginBottom: 24 }}>
      {[["products", "🛒 Products"], ["services", "🙏 Pandit Bookings"]].map(([k, l]) => (
        <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: "10px 0", borderRadius: 9, border: "none", background: tab === k ? C.white : "transparent", color: tab === k ? C.saffron : C.textLight, fontWeight: tab === k ? 700 : 400, fontSize: 13, cursor: "pointer", transition: "all 0.2s", boxShadow: tab === k ? "0 2px 8px rgba(0,0,0,0.06)" : "none" }}>
          {l}
        </button>
      ))}
    </div>
  );
}
 
// ─── CART VIEW ────────────────────────────────────────────────────────────────
function CartView({ productCart, setProductCart, serviceCart, setServiceCart, onCheckout, tab, setTab }) {
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState(null);
  const [couponError, setCouponError] = useState(false);
 
  const applyCoupon = () => {
    const c = COUPONS[couponInput.trim().toUpperCase()];
    if (c) { setAppliedCoupon({ code: couponInput.toUpperCase(), ...c }); setCouponMsg(`✓ ${c.desc} applied!`); setCouponError(false); }
    else { setCouponMsg("Invalid coupon code."); setCouponError(true); setAppliedCoupon(null); }
  };
 
  const updateQty = (id, delta) => setProductCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  const removeItem = (id) => setProductCart(prev => prev.filter(i => i.id !== id));
  const removeService = (id) => setServiceCart(prev => prev.filter(i => i.id !== id));
  const toggleSamagri = (id) => setServiceCart(prev => prev.map(i => i.id === id ? { ...i, samagriKit: !i.samagriKit } : i));
 
  const pt = calcProductTotals(productCart, appliedCoupon, appliedCoupon?.type === "shipping");
  const st = calcServiceTotal(serviceCart);
 
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 28 }}>
      {/* Left */}
      <div>
        <TabToggle tab={tab} setTab={setTab} />
 
        {/* PRODUCT CART */}
        {tab === "products" && (
          <div>
            {productCart.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: C.textLight }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 6 }}>Your cart is empty</div>
                <div style={{ fontSize: 13 }}>Add puja items to get started</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {productCart.map(item => {
                  const disc = Math.round(((item.mrp - item.price) / item.mrp) * 100);
                  return (
                    <div key={item.id} style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: "18px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
                      <div style={{ width: 64, height: 64, background: C.cream, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, flexShrink: 0 }}>{item.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: C.saffron, fontWeight: 700, marginBottom: 2 }}>{item.category}</div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 2 }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: C.textLight, marginBottom: 10 }}>Variant: {item.variant}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          {/* Qty stepper */}
                          <div style={{ display: "flex", alignItems: "center", border: `1.5px solid ${C.border}`, borderRadius: 9, overflow: "hidden" }}>
                            <button onClick={() => updateQty(item.id, -1)} style={{ width: 32, height: 32, border: "none", background: C.cream, cursor: "pointer", fontSize: 16, color: C.textMid, fontWeight: 700 }}>−</button>
                            <span style={{ width: 32, textAlign: "center", fontSize: 14, fontWeight: 700, color: C.text }}>{item.qty}</span>
                            <button onClick={() => updateQty(item.id, +1)} style={{ width: 32, height: 32, border: "none", background: C.cream, cursor: "pointer", fontSize: 16, color: C.textMid, fontWeight: 700 }}>+</button>
                          </div>
                          <button onClick={() => removeItem(item.id)} style={{ fontSize: 12, color: C.red, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>✕ Remove</button>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>₹{(item.price * item.qty).toLocaleString()}</div>
                        {disc > 0 && <div style={{ fontSize: 12, color: C.textLight, textDecoration: "line-through" }}>₹{(item.mrp * item.qty).toLocaleString()}</div>}
                        {disc > 0 && <div style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>{disc}% off</div>}
                        <div style={{ fontSize: 10, color: C.textLight, marginTop: 4 }}>+{item.gstPct}% GST</div>
                      </div>
                    </div>
                  );
                })}
 
                {/* Coupon */}
                <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "16px 18px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>🏷 Apply Coupon</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())} placeholder="Enter coupon code" style={{ flex: 1, padding: "10px 14px", borderRadius: 9, border: `1.5px solid ${appliedCoupon ? C.green : C.border}`, fontSize: 13, color: C.text, background: C.cream, outline: "none", letterSpacing: 1, fontWeight: 600 }} />
                    <button onClick={applyCoupon} style={{ padding: "10px 18px", borderRadius: 9, background: C.saffron, color: C.white, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Apply</button>
                    {appliedCoupon && <button onClick={() => { setAppliedCoupon(null); setCouponMsg(null); setCouponInput(""); }} style={{ padding: "10px 14px", borderRadius: 9, background: C.redBg, color: C.red, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Remove</button>}
                  </div>
                  {couponMsg && <div style={{ fontSize: 12, marginTop: 8, fontWeight: 600, color: couponError ? C.red : C.green }}>{couponMsg}</div>}
                  <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {Object.entries(COUPONS).map(([code, c]) => (
                      <span key={code} onClick={() => { setCouponInput(code); }} style={{ fontSize: 11, color: C.gold, background: C.goldBg, padding: "3px 10px", borderRadius: 999, cursor: "pointer", fontWeight: 700 }}>{code}</span>
                    ))}
                  </div>
                </div>
 
                {/* Delivery note */}
                <div style={{ background: C.greenBg, border: `1px solid ${C.green}33`, borderRadius: 12, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 20 }}>🚚</span>
                  <div style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>
                    {pt.shipping === 0 ? "Free delivery on this order!" : `Add ₹${499 - pt.subtotal} more for free delivery`}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
 
        {/* SERVICE CART */}
        {tab === "services" && (
          <div>
            {serviceCart.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: C.textLight }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🙏</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 6 }}>No bookings in cart</div>
                <div style={{ fontSize: 13 }}>Book a pandit to get started</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {serviceCart.map(item => (
                  <div key={item.id} style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: "20px" }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
                      <div style={{ width: 56, height: 56, background: C.saffronBg, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{item.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 2 }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: C.textLight, marginBottom: 6 }}>{item.pandit} · {item.duration}</div>
                        <div style={{ display: "flex", gap: 14, fontSize: 12, color: C.textMid }}>
                          <span>📅 {item.date}</span>
                          <span>⏰ {item.time}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>₹{item.price.toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: C.textLight }}>Pandit charges</div>
                      </div>
                    </div>
                    {/* Samagri toggle */}
                    <div style={{ background: C.cream, borderRadius: 10, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>📦 Add Samagri Kit</div>
                        <div style={{ fontSize: 11, color: C.textLight }}>All puja items delivered to your door</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.saffron }}>+₹{item.samagriPrice}</span>
                        <div onClick={() => toggleSamagri(item.id)} style={{ width: 40, height: 22, borderRadius: 11, background: item.samagriKit ? C.saffron : C.creamDark, position: "relative", cursor: "pointer", transition: "background 0.2s" }}>
                          <div style={{ position: "absolute", top: 3, left: item.samagriKit ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: C.white, transition: "left 0.2s" }} />
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <button onClick={() => removeService(item.id)} style={{ fontSize: 12, color: C.red, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>✕ Remove booking</button>
                      <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Subtotal: ₹{(item.price + (item.samagriKit ? item.samagriPrice : 0)).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
                <div style={{ background: C.purpleBg, border: `1px solid ${C.purple}22`, borderRadius: 12, padding: "12px 16px", fontSize: 13, color: C.purple, fontWeight: 600 }}>
                  🔔 Pandit will confirm booking within 30 minutes. Payment held until confirmation.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
 
      {/* Right — Summary */}
      <div>
        <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: "24px", position: "sticky", top: 20 }}>
          <h3 style={{ fontFamily: "'Georgia',serif", fontSize: 18, color: C.text, margin: "0 0 20px" }}>Order Summary</h3>
 
          {tab === "products" && productCart.length > 0 && (
            <>
              <SummaryRow label="MRP Total" value={`₹${pt.mrpTotal.toLocaleString()}`} />
              <SummaryRow label="Product Discount" value={`-₹${pt.savings.toLocaleString()}`} color={C.green} />
              <SummaryRow label="Subtotal" value={`₹${pt.subtotal.toLocaleString()}`} bold />
              <SummaryRow label={`GST (avg ${Math.round(pt.gst / pt.subtotal * 100)}%)`} value={`₹${pt.gst}`} />
              <SummaryRow label="Delivery" value={pt.shipping === 0 ? "FREE" : `₹${pt.shipping}`} color={pt.shipping === 0 ? C.green : C.text} />
              {appliedCoupon && <SummaryRow label={`Coupon (${appliedCoupon.code})`} value={`-₹${pt.discount}`} color={C.green} />}
              <div style={{ borderTop: `1.5px dashed ${C.border}`, margin: "14px 0", paddingTop: 14 }}>
                <SummaryRow label="Total Payable" value={`₹${pt.total.toLocaleString()}`} bold color={C.saffron} />
              </div>
              {pt.savings > 0 && <div style={{ background: C.greenBg, borderRadius: 9, padding: "10px 14px", fontSize: 12, color: C.green, fontWeight: 600, marginBottom: 16 }}>🎉 You save ₹{(pt.savings + pt.discount).toLocaleString()} on this order</div>}
              <button onClick={() => onCheckout("products")} style={{ width: "100%", padding: "14px", borderRadius: 12, background: C.saffron, color: C.white, border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                Proceed to Checkout →
              </button>
            </>
          )}
 
          {tab === "services" && serviceCart.length > 0 && (
            <>
              {serviceCart.map(s => (
                <div key={s.id} style={{ marginBottom: 10 }}>
                  <SummaryRow label={s.name} value={`₹${s.price.toLocaleString()}`} />
                  {s.samagriKit && <SummaryRow label="  Samagri Kit" value={`₹${s.samagriPrice}`} small />}
                </div>
              ))}
              <div style={{ borderTop: `1.5px dashed ${C.border}`, margin: "14px 0", paddingTop: 14 }}>
                <SummaryRow label="Total" value={`₹${st.toLocaleString()}`} bold color={C.saffron} />
              </div>
              <div style={{ background: C.goldBg, borderRadius: 9, padding: "10px 14px", fontSize: 12, color: C.gold, fontWeight: 600, marginBottom: 16 }}>⚡ Platform fee: FREE · Pay only after pandit confirms</div>
              <button onClick={() => onCheckout("services")} style={{ width: "100%", padding: "14px", borderRadius: 12, background: C.saffron, color: C.white, border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                Confirm Booking & Pay →
              </button>
            </>
          )}
 
          {((tab === "products" && productCart.length === 0) || (tab === "services" && serviceCart.length === 0)) && (
            <div style={{ textAlign: "center", color: C.textLight, padding: "20px 0", fontSize: 13 }}>Nothing to checkout yet.</div>
          )}
 
          <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            {["UPI","Razorpay","Cards","COD","Wallets"].map(p => (
              <span key={p} style={{ fontSize: 10, color: C.textLight, background: C.cream, padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>{p}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
 
// ─── ADDRESS STEP ─────────────────────────────────────────────────────────────
function AddressStep({ selectedAddr, setSelectedAddr, flow }) {
  const [showNew, setShowNew] = useState(false);
  const [newAddr, setNewAddr] = useState({ name: "", phone: "", line1: "", line2: "", city: "", state: "", pin: "" });
 
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28 }}>
      <div>
        <h2 style={{ fontFamily: "'Georgia',serif", fontSize: 22, color: C.text, margin: "0 0 6px" }}>
          {flow === "products" ? "Delivery Address" : "Ceremony Address"}
        </h2>
        <p style={{ color: C.textLight, fontSize: 13, margin: "0 0 20px" }}>
          {flow === "products" ? "Where should we deliver your order?" : "Where will the puja ceremony take place?"}
        </p>
 
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {SAVED_ADDRESSES.map(a => (
            <div key={a.id} onClick={() => setSelectedAddr(a)} style={{ background: C.white, borderRadius: 14, border: `2px solid ${selectedAddr?.id === a.id ? C.saffron : C.border}`, padding: "16px 18px", cursor: "pointer", boxShadow: selectedAddr?.id === a.id ? `0 0 0 3px ${C.saffron}18` : "none", transition: "all 0.15s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${selectedAddr?.id === a.id ? C.saffron : C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {selectedAddr?.id === a.id && <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.saffron }} />}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.saffron, background: C.saffronBg, padding: "2px 8px", borderRadius: 999 }}>{a.label}</span>
                  {a.isDefault && <span style={{ fontSize: 11, fontWeight: 700, color: C.green, background: C.greenBg, padding: "2px 8px", borderRadius: 999 }}>Default</span>}
                </div>
                <button style={{ fontSize: 11, color: C.blue, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Edit</button>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>{a.name}</div>
              <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>{a.line1}, {a.line2}, {a.city}, {a.state} — {a.pin}</div>
              <div style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>📞 {a.phone}</div>
            </div>
          ))}
        </div>
 
        <button onClick={() => setShowNew(v => !v)} style={{ padding: "11px 18px", borderRadius: 10, border: `1.5px dashed ${C.saffron}`, background: C.saffronBg, color: C.saffron, fontWeight: 600, fontSize: 13, cursor: "pointer", width: "100%" }}>
          {showNew ? "✕ Cancel" : "+ Add New Address"}
        </button>
 
        {showNew && (
          <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "20px", marginTop: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[["Full Name","name","text"],["Phone","phone","tel"],["Address Line 1","line1","text"],["Address Line 2","line2","text"],["City","city","text"],["State","state","text"],["Pincode","pin","text"]].map(([label, key, type]) => (
                <div key={key} style={{ gridColumn: key === "line1" || key === "line2" ? "1 / -1" : "auto" }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textMid, marginBottom: 5 }}>{label}</label>
                  <input type={type} value={newAddr[key]} onChange={e => setNewAddr(v => ({...v, [key]: e.target.value}))} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text, background: C.cream, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
            <button style={{ marginTop: 14, padding: "10px 20px", borderRadius: 9, background: C.saffron, color: C.white, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Save & Use This Address</button>
          </div>
        )}
      </div>
 
      {/* Delivery options */}
      {flow === "products" && (
        <div>
          <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "20px" }}>
            <h3 style={{ fontFamily: "'Georgia',serif", fontSize: 16, color: C.text, margin: "0 0 14px" }}>Delivery Options</h3>
            {[
              { id: "std", label: "Standard Delivery", sub: "Delivered in 3–5 days", price: "FREE", badge: null },
              { id: "exp", label: "Express Delivery", sub: "Delivered in 1–2 days", price: "₹79", badge: "Fast" },
              { id: "same", label: "Same Day Delivery", sub: "Before 8 PM today", price: "₹149", badge: "Today" },
            ].map((opt, i) => (
              <div key={opt.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${i === 0 ? C.saffron : C.border}`, background: i === 0 ? C.saffronBg : C.white, marginBottom: 10, cursor: "pointer" }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${i === 0 ? C.saffron : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {i === 0 && <div style={{ width: 9, height: 9, borderRadius: "50%", background: C.saffron }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "flex", gap: 8, alignItems: "center" }}>
                    {opt.label}
                    {opt.badge && <span style={{ fontSize: 10, color: C.saffron, background: C.saffronBg, padding: "2px 7px", borderRadius: 999, fontWeight: 700 }}>{opt.badge}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: C.textLight }}>{opt.sub}</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? C.green : C.text }}>{opt.price}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
 
// ─── PAYMENT STEP ─────────────────────────────────────────────────────────────
function PaymentStep({ flow, productCart, serviceCart, appliedCoupon }) {
  const [method, setMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [codConfirm, setCodConfirm] = useState(false);
 
  const pt = calcProductTotals(productCart, appliedCoupon, appliedCoupon?.type === "shipping");
  const st = calcServiceTotal(serviceCart);
  const total = flow === "products" ? pt.total : st;
 
  const METHODS = [
    { id: "upi", label: "UPI", icon: "📱", sub: "PhonePe · GPay · Paytm · BHIM" },
    { id: "card", label: "Credit / Debit Card", icon: "💳", sub: "All major cards accepted" },
    { id: "netbanking", label: "Net Banking", icon: "🏦", sub: "All major banks supported" },
    { id: "wallet", label: "Wallets", icon: "👛", sub: "Paytm · Amazon Pay · Mobikwik" },
    { id: "cod", label: "Cash on Delivery", icon: "💵", sub: "Pay when you receive (up to ₹3,000)" },
  ];
 
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28 }}>
      <div>
        <h2 style={{ fontFamily: "'Georgia',serif", fontSize: 22, color: C.text, margin: "0 0 6px" }}>Payment Method</h2>
        <p style={{ color: C.textLight, fontSize: 13, margin: "0 0 20px" }}>All transactions are secured and encrypted.</p>
 
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {METHODS.map(m => (
            <div key={m.id}>
              <div onClick={() => setMethod(m.id)} style={{ background: C.white, borderRadius: 14, border: `2px solid ${method === m.id ? C.saffron : C.border}`, padding: "16px 18px", cursor: "pointer", boxShadow: method === m.id ? `0 0 0 3px ${C.saffron}18` : "none", transition: "all 0.15s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${method === m.id ? C.saffron : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {method === m.id && <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.saffron }} />}
                  </div>
                  <span style={{ fontSize: 20 }}>{m.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: C.textLight }}>{m.sub}</div>
                  </div>
                  {m.id === "razorpay" && <span style={{ fontSize: 10, color: C.blue, background: C.blueBg, padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>Recommended</span>}
                </div>
              </div>
 
              {/* Inline form per method */}
              {method === m.id && m.id === "upi" && (
                <div style={{ background: C.saffronBg, borderRadius: "0 0 12px 12px", padding: "14px 18px", marginTop: -6, border: `1.5px solid ${C.saffron}`, borderTop: "none" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.textMid, marginBottom: 8 }}>Enter UPI ID</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@upi" style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text, background: C.white, outline: "none" }} />
                    <button style={{ padding: "9px 16px", borderRadius: 8, background: C.saffron, color: C.white, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Verify</button>
                  </div>
                  <div style={{ fontSize: 11, color: C.textLight, marginTop: 6 }}>Or scan QR code at payment screen</div>
                </div>
              )}
              {method === m.id && m.id === "card" && (
                <div style={{ background: C.saffronBg, borderRadius: "0 0 12px 12px", padding: "16px 18px", marginTop: -6, border: `1.5px solid ${C.saffron}`, borderTop: "none" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <input placeholder="Card Number" style={{ padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text, background: C.white, outline: "none" }} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                      <input placeholder="MM / YY" style={{ padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text, background: C.white, outline: "none" }} />
                      <input placeholder="CVV" type="password" maxLength={4} style={{ padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text, background: C.white, outline: "none" }} />
                      <input placeholder="Name on card" style={{ padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text, background: C.white, outline: "none" }} />
                    </div>
                  </div>
                </div>
              )}
              {method === m.id && m.id === "netbanking" && (
                <div style={{ background: C.saffronBg, borderRadius: "0 0 12px 12px", padding: "14px 18px", marginTop: -6, border: `1.5px solid ${C.saffron}`, borderTop: "none" }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {["SBI","HDFC","ICICI","Axis","Kotak","PNB"].map(b => (
                      <button key={b} style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, color: C.textMid, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>{b}</button>
                    ))}
                    <button style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, color: C.blue, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Other Banks</button>
                  </div>
                </div>
              )}
              {method === m.id && m.id === "wallet" && (
                <div style={{ background: C.saffronBg, borderRadius: "0 0 12px 12px", padding: "14px 18px", marginTop: -6, border: `1.5px solid ${C.saffron}`, borderTop: "none" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["Paytm","Amazon Pay","Mobikwik","Freecharge"].map(w => (
                      <button key={w} style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, color: C.textMid, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>{w}</button>
                    ))}
                  </div>
                </div>
              )}
              {method === m.id && m.id === "cod" && (
                <div style={{ background: C.goldBg, borderRadius: "0 0 12px 12px", padding: "14px 18px", marginTop: -6, border: `1.5px solid ${C.marigold}`, borderTop: "none" }}>
                  <label style={{ display: "flex", gap: 10, cursor: "pointer", fontSize: 13, color: C.textMid, fontWeight: 500 }}>
                    <input type="checkbox" checked={codConfirm} onChange={e => setCodConfirm(e.target.checked)} style={{ accentColor: C.saffron }} />
                    I understand I'll pay ₹{total.toLocaleString()} in cash to the delivery person.
                  </label>
                  <div style={{ fontSize: 11, color: C.textLight, marginTop: 6 }}>COD available for orders up to ₹3,000. A ₹25 COD fee applies.</div>
                </div>
              )}
            </div>
          ))}
        </div>
 
        {/* Razorpay note */}
        <div style={{ marginTop: 16, background: C.blueBg, border: `1px solid ${C.blue}22`, borderRadius: 12, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 18 }}>🔒</span>
          <div style={{ fontSize: 12, color: C.blue }}>
            <strong>Secured by Razorpay.</strong> Your payment info is encrypted with 256-bit SSL. We never store card details.
          </div>
        </div>
      </div>
 
      {/* Order summary sidebar */}
      <div>
        <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "20px", position: "sticky", top: 20 }}>
          <h3 style={{ fontFamily: "'Georgia',serif", fontSize: 16, color: C.text, margin: "0 0 16px" }}>Order Total</h3>
          {flow === "products" ? (
            <>
              <SummaryRow label="Subtotal" value={`₹${pt.subtotal.toLocaleString()}`} />
              <SummaryRow label="GST" value={`₹${pt.gst}`} />
              <SummaryRow label="Delivery" value={pt.shipping === 0 ? "FREE" : `₹${pt.shipping}`} color={pt.shipping === 0 ? C.green : C.text} />
              {appliedCoupon && <SummaryRow label={`Coupon (${appliedCoupon.code})`} value={`-₹${pt.discount}`} color={C.green} />}
              <div style={{ borderTop: `1.5px dashed ${C.border}`, margin: "12px 0 12px" }} />
              <SummaryRow label="Total" value={`₹${pt.total.toLocaleString()}`} bold color={C.saffron} />
            </>
          ) : (
            <>
              {serviceCart.map(s => <SummaryRow key={s.id} label={s.name} value={`₹${(s.price + (s.samagriKit ? s.samagriPrice : 0)).toLocaleString()}`} />)}
              <div style={{ borderTop: `1.5px dashed ${C.border}`, margin: "12px 0 12px" }} />
              <SummaryRow label="Total" value={`₹${st.toLocaleString()}`} bold color={C.saffron} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
 
// ─── CONFIRM STEP ─────────────────────────────────────────────────────────────
function ConfirmStep({ flow, productCart, serviceCart, selectedAddr, appliedCoupon, onPlace }) {
  const pt = calcProductTotals(productCart, appliedCoupon, appliedCoupon?.type === "shipping");
  const st = calcServiceTotal(serviceCart);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28 }}>
      <div>
        <h2 style={{ fontFamily: "'Georgia',serif", fontSize: 22, color: C.text, margin: "0 0 6px" }}>Review Your Order</h2>
        <p style={{ color: C.textLight, fontSize: 13, margin: "0 0 20px" }}>Double-check everything before placing.</p>
 
        {/* Items */}
        <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "20px", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${C.creamDark}` }}>{flow === "products" ? "📦 Products" : "🙏 Pandit Bookings"}</div>
          {flow === "products" && productCart.map(i => (
            <div key={i.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 10, alignItems: "center" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 18 }}>{i.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, color: C.text }}>{i.name}</div>
                  <div style={{ fontSize: 11, color: C.textLight }}>Qty: {i.qty} × ₹{i.price}</div>
                </div>
              </div>
              <span style={{ fontWeight: 700, color: C.text }}>₹{(i.price * i.qty).toLocaleString()}</span>
            </div>
          ))}
          {flow === "services" && serviceCart.map(s => (
            <div key={s.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <span>{s.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, color: C.text }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: C.textLight }}>{s.pandit} · {s.date} {s.time}</div>
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: C.text }}>₹{(s.price + (s.samagriKit ? s.samagriPrice : 0)).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
 
        {/* Address */}
        {selectedAddr && (
          <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "16px 20px", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 10 }}>📍 {flow === "products" ? "Delivery" : "Ceremony"} Address</div>
            <div style={{ fontSize: 13, color: C.textMid }}><strong>{selectedAddr.name}</strong></div>
            <div style={{ fontSize: 13, color: C.textMid }}>{selectedAddr.line1}, {selectedAddr.line2}, {selectedAddr.city}, {selectedAddr.state} — {selectedAddr.pin}</div>
            <div style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>📞 {selectedAddr.phone}</div>
          </div>
        )}
      </div>
 
      {/* Final summary + CTA */}
      <div>
        <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "24px", position: "sticky", top: 20 }}>
          <h3 style={{ fontFamily: "'Georgia',serif", fontSize: 16, color: C.text, margin: "0 0 16px" }}>Payment Summary</h3>
          {flow === "products" ? (
            <>
              <SummaryRow label="Subtotal" value={`₹${pt.subtotal}`} />
              <SummaryRow label="GST" value={`₹${pt.gst}`} />
              <SummaryRow label="Delivery" value={pt.shipping === 0 ? "FREE" : `₹${pt.shipping}`} color={pt.shipping === 0 ? C.green : C.text} />
              {appliedCoupon && <SummaryRow label={`Coupon`} value={`-₹${pt.discount}`} color={C.green} />}
              <div style={{ borderTop: `1.5px dashed ${C.border}`, margin: "12px 0" }} />
              <SummaryRow label="You Pay" value={`₹${pt.total.toLocaleString()}`} bold color={C.saffron} />
            </>
          ) : (
            <>
              {serviceCart.map(s => <SummaryRow key={s.id} label={s.name} value={`₹${(s.price + (s.samagriKit ? s.samagriPrice : 0)).toLocaleString()}`} />)}
              <div style={{ borderTop: `1.5px dashed ${C.border}`, margin: "12px 0" }} />
              <SummaryRow label="You Pay" value={`₹${st.toLocaleString()}`} bold color={C.saffron} />
            </>
          )}
          <button onClick={onPlace} style={{ width: "100%", padding: "14px", borderRadius: 12, background: C.saffron, color: C.white, border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 16 }}>
            🙏 Place Order · ₹{(flow === "products" ? pt.total : st).toLocaleString()}
          </button>
          <p style={{ fontSize: 11, color: C.textLight, textAlign: "center", marginTop: 10, lineHeight: 1.6 }}>
            By placing order you agree to our Terms & Conditions. Powered by Razorpay.
          </p>
        </div>
      </div>
    </div>
  );
}
 
// ─── SUCCESS SCREEN ───────────────────────────────────────────────────────────
function SuccessScreen({ flow, onReset }) {
  const orderId = flow === "products" ? "#ORD-2026-1999" : "#BK-2026-0912";
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.white, borderRadius: 24, padding: "56px 48px", maxWidth: 480, width: "100%", textAlign: "center", border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>{flow === "products" ? "📦" : "🙏"}</div>
        <div style={{ fontFamily: "'Georgia',serif", fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 10 }}>
          {flow === "products" ? "Order Placed!" : "Booking Confirmed!"}
        </div>
        <div style={{ fontSize: 14, color: C.textMid, lineHeight: 1.7, marginBottom: 28 }}>
          {flow === "products"
            ? "Your puja samagri is on its way. You'll receive updates via SMS and WhatsApp."
            : "Your pandit will confirm within 30 minutes. You'll be notified via SMS and WhatsApp."}
        </div>
        <div style={{ background: C.greenBg, border: `1px solid ${C.green}33`, borderRadius: 14, padding: "18px 20px", marginBottom: 28 }}>
          <div style={{ fontSize: 13, color: C.green, fontWeight: 700, marginBottom: 6 }}>✓ {flow === "products" ? "Order" : "Booking"} ID: {orderId}</div>
          <div style={{ fontSize: 12, color: C.textLight }}>Confirmation sent to your registered mobile & email</div>
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button style={{ padding: "11px 22px", borderRadius: 10, background: C.saffron, color: C.white, border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Track {flow === "products" ? "Order" : "Booking"}</button>
          <button onClick={onReset} style={{ padding: "11px 22px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.white, color: C.textMid, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Continue Shopping</button>
        </div>
      </div>
    </div>
  );
}
 
// ─── ROOT ─────────────────────────────────────────────────────────────────────
const PRODUCT_STEPS = ["Cart", "Address", "Payment", "Confirm"];
const SERVICE_STEPS = ["Cart", "Address", "Payment", "Confirm"];
 
export default function CartCheckout() {
  const [productCart, setProductCart] = useState(INIT_PRODUCT_CART);
  const [serviceCart, setServiceCart] = useState(INIT_SERVICE_CART);
  const [cartTab, setCartTab] = useState("products");
  const [flow, setFlow] = useState(null);         // "products" | "services"
  const [step, setStep] = useState(0);             // 0=cart 1=address 2=payment 3=confirm
  const [selectedAddr, setSelectedAddr] = useState(SAVED_ADDRESSES[0]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [placed, setPlaced] = useState(false);
 
  const startCheckout = (f) => { setFlow(f); setStep(1); };
  const reset = () => { setFlow(null); setStep(0); setPlaced(false); };
  const steps = flow === "products" ? PRODUCT_STEPS : SERVICE_STEPS;
 
  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'Segoe UI','Helvetica Neue',sans-serif" }}>
      {/* Navbar */}
      <nav style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={reset}>
            <span style={{ fontSize: 20 }}>🪔</span>
            <span style={{ fontFamily: "'Georgia',serif", fontWeight: 700, fontSize: 16, color: C.saffron }}>TheKhatuMart</span>
          </div>
          <div style={{ fontSize: 13, color: C.textLight }}>
            🔒 Secured Checkout &nbsp;·&nbsp; Powered by Razorpay
          </div>
        </div>
      </nav>
 
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
        {/* Stepper (only during checkout) */}
        {step > 0 && !placed && (
          <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "4px 24px", marginBottom: 28 }}>
            <Stepper steps={steps} current={step} />
          </div>
        )}
 
        {/* Back button */}
        {step > 0 && !placed && (
          <button onClick={() => step === 1 ? reset() : setStep(s => s - 1)} style={{ marginBottom: 20, padding: "8px 16px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, color: C.textMid, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            ← Back
          </button>
        )}
 
        {/* Views */}
        {placed ? (
          <SuccessScreen flow={flow} onReset={reset} />
        ) : step === 0 ? (
          <CartView productCart={productCart} setProductCart={setProductCart} serviceCart={serviceCart} setServiceCart={setServiceCart} onCheckout={startCheckout} tab={cartTab} setTab={setCartTab} />
        ) : step === 1 ? (
          <AddressStep selectedAddr={selectedAddr} setSelectedAddr={setSelectedAddr} flow={flow} />
        ) : step === 2 ? (
          <PaymentStep flow={flow} productCart={productCart} serviceCart={serviceCart} appliedCoupon={appliedCoupon} />
        ) : step === 3 ? (
          <ConfirmStep flow={flow} productCart={productCart} serviceCart={serviceCart} selectedAddr={selectedAddr} appliedCoupon={appliedCoupon} onPlace={() => setPlaced(true)} />
        ) : null}
 
        {/* Next button */}
        {step > 0 && step < 3 && !placed && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 28 }}>
            <button onClick={() => setStep(s => s + 1)} style={{ padding: "13px 32px", borderRadius: 11, background: C.saffron, color: C.white, border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              {step === 1 ? "Continue to Payment →" : "Review Order →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

