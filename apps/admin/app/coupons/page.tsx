"use client";

import { useState, useRef } from "react";

// ─── THEME ────────────────────────────────────────────────────────────────────
const C = {
  // Dark admin sidebar
  sb: "#0F0B07", sbBorder: "#2A1E0E", sbText: "#C8A870", sbDim: "#5A4030", sbAccent: "#E8560A",
  // Light content
  bg: "#FAF7F2", bgCard: "#FFFFFF", bgHover: "#F5F0E8", border: "#E8DDD0", borderLight: "#F0E8DC",
  // Brand
  saffron: "#E8560A", saffronDark: "#B8400A", saffronBg: "#FFF3EC",
  marigold: "#F5A623", marigoldBg: "#FFFBE8",
  gold: "#C8860A", goldBg: "#FFF8E8",
  // Semantic
  text: "#1A1208", textMid: "#5C4030", textLight: "#9A8070",
  green: "#1A7A3C", greenBg: "#EDFAF3",
  red: "#C0392B", redBg: "#FFF0EE",
  blue: "#1A5C9E", blueBg: "#EEF4FF",
  purple: "#6B2EA8", purpleBg: "#F5EEFF",
  white: "#FFFFFF",
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const INIT_COUPONS = [
  { id:"c1", code:"WELCOME100",  type:"flat",    value:100,  maxDiscount:100,  minOrder:299,  usageLimit:1,    usedCount:0,   isActive:true,  expiresAt:"2026-12-31", desc:"₹100 off first order",         applicableTo:"all",      category:"",         festivalTag:"",        createdAt:"1 Jan 2026" },
  { id:"c2", code:"DIWALI20",    type:"percent", value:20,   maxDiscount:200,  minOrder:500,  usageLimit:500,  usedCount:187, isActive:true,  expiresAt:"2026-11-05", desc:"20% off — Diwali special",      applicableTo:"all",      category:"",         festivalTag:"Diwali",  createdAt:"1 Oct 2026" },
  { id:"c3", code:"NAVRATRI25",  type:"percent", value:25,   maxDiscount:300,  minOrder:699,  usageLimit:300,  usedCount:300, isActive:false, expiresAt:"2026-10-11", desc:"25% off for Navratri",           applicableTo:"category", category:"festival-kits", festivalTag:"Navratri",createdAt:"1 Sep 2026" },
  { id:"c4", code:"FREESHIP",    type:"shipping",value:0,    maxDiscount:0,    minOrder:0,    usageLimit:1000, usedCount:412, isActive:true,  expiresAt:"2026-12-31", desc:"Free shipping on any order",     applicableTo:"all",      category:"",         festivalTag:"",        createdAt:"1 Jun 2026" },
  { id:"c5", code:"HAWAN30",     type:"percent", value:30,   maxDiscount:150,  minOrder:499,  usageLimit:200,  usedCount:89,  isActive:true,  expiresAt:"2026-12-31", desc:"30% off on hawan products",     applicableTo:"category", category:"hawan-materials",festivalTag:"",   createdAt:"15 Jun 2026"},
  { id:"c7", code:"BULK499",     type:"flat",    value:499,  maxDiscount:499,  minOrder:2999, usageLimit:100,  usedCount:12,  isActive:true,  expiresAt:"2026-12-31", desc:"₹499 off orders above ₹2999",   applicableTo:"all",      category:"",         festivalTag:"",        createdAt:"1 Jun 2026" },
  { id:"c8", code:"GHEE10",      type:"percent", value:10,   maxDiscount:80,   minOrder:249,  usageLimit:null, usedCount:203, isActive:true,  expiresAt:"2026-12-31", desc:"10% off on ghee & oils",        applicableTo:"category", category:"ghee-oils", festivalTag:"",        createdAt:"10 Jun 2026"},
];

const COUPON_STATS = [
  { label:"Total Coupons",    value:INIT_COUPONS.length,                              icon:"🏷️", color:C.saffron  },
  { label:"Active",           value:INIT_COUPONS.filter(c=>c.isActive).length,        icon:"✅", color:C.green    },
  { label:"Total Uses",       value:INIT_COUPONS.reduce((s,c)=>s+c.usedCount,0),     icon:"👆", color:C.blue     },
  { label:"Discount Given",   value:"₹38,400",                                        icon:"💸", color:C.red      },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function calcDiscount(coupon, orderValue) {
  if (!coupon || orderValue < coupon.minOrder) return 0;
  if (coupon.type === "flat")     return coupon.value;
  if (coupon.type === "shipping") return 49; // estimated shipping saved
  if (coupon.type === "percent") {
    const disc = Math.round(orderValue * coupon.value / 100);
    return coupon.maxDiscount ? Math.min(disc, coupon.maxDiscount) : disc;
  }
  return 0;
}

function typeLabel(type) {
  return { flat:"₹ Flat Off", percent:"% Percentage", shipping:"🚚 Free Shipping" }[type] || type;
}

function StatusPill({ active, expired }) {
  if (expired) return <span style={{ display:"inline-flex",alignItems:"center",gap:4,background:C.redBg,color:C.red,fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:999 }}>✕ Expired</span>;
  return <span style={{ display:"inline-flex",alignItems:"center",gap:4,background:active?C.greenBg:C.bgHover,color:active?C.green:C.textLight,fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:999 }}><span style={{ width:5,height:5,borderRadius:"50%",background:active?C.green:C.textLight }}/>{active?"Active":"Paused"}</span>;
}

function TypeBadge({ type }) {
  const map = { flat:{bg:C.saffronBg,color:C.saffron}, percent:{bg:C.purpleBg,color:C.purple}, shipping:{bg:C.greenBg,color:C.green} };
  const s = map[type]||map.flat;
  return <span style={{ background:s.bg,color:s.color,fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:999 }}>{typeLabel(type)}</span>;
}

function Card({ children, style={} }) {
  return <div style={{ background:C.bgCard,borderRadius:14,border:`1px solid ${C.border}`,...style }}>{children}</div>;
}

function Input({ label, type="text", value, onChange, placeholder, helper, prefix, suffix }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:16 }}>
      {label && <label style={{ display:"block",fontSize:12,fontWeight:700,color:C.textMid,marginBottom:6,textTransform:"uppercase",letterSpacing:0.5 }}>{label}</label>}
      <div style={{ position:"relative",display:"flex",alignItems:"center" }}>
        {prefix && <span style={{ position:"absolute",left:12,fontSize:13,color:C.textLight,pointerEvents:"none" }}>{prefix}</span>}
        <input type={type} value={value} onChange={onChange} placeholder={placeholder}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          style={{ width:"100%",boxSizing:"border-box",padding:`11px ${suffix?"40px":"14px"} 11px ${prefix?"32px":"14px"}`,borderRadius:10,border:`1.5px solid ${focused?C.saffron:C.border}`,fontSize:14,color:C.text,background:C.bgHover,outline:"none",fontFamily:"inherit",boxShadow:focused?`0 0 0 3px ${C.saffron}18`:"none",transition:"all 0.2s" }}/>
        {suffix && <span style={{ position:"absolute",right:12,fontSize:13,color:C.textLight }}>{suffix}</span>}
      </div>
      {helper && <p style={{ fontSize:11,color:C.textLight,margin:"5px 0 0" }}>{helper}</p>}
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <div onClick={()=>onChange(!on)} style={{ width:44,height:24,borderRadius:12,background:on?C.saffron:C.border,position:"relative",cursor:"pointer",transition:"background 0.2s",flexShrink:0 }}>
      <div style={{ position:"absolute",top:3,left:on?22:3,width:18,height:18,borderRadius:"50%",background:C.white,transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.15)" }}/>
    </div>
  );
}

// ─── COUPON CARD (ticket shape) ────────────────────────────────────────────────
function CouponTicket({ coupon, onToggle, onEdit, onDelete, selected, onClick }) {
  const isExpired = new Date(coupon.expiresAt) < new Date();
  const usagePct  = coupon.usageLimit ? Math.round((coupon.usedCount / coupon.usageLimit) * 100) : null;

  return (
    <div onClick={onClick} style={{
      background:C.bgCard, borderRadius:16,
      border:`2px solid ${selected?C.saffron:C.border}`,
      overflow:"hidden", cursor:"pointer", transition:"all 0.2s",
      boxShadow:selected?`0 0 0 3px ${C.saffron}18`:"none",
      opacity:isExpired?0.6:1,
    }}>
      {/* Top section */}
      <div style={{ padding:"18px 20px 14px", display:"flex", gap:14, alignItems:"flex-start" }}>
        {/* Code block */}
        <div style={{ background:isExpired?C.bgHover:C.saffronBg, borderRadius:10, padding:"10px 14px", textAlign:"center", flexShrink:0, minWidth:100 }}>
          <div style={{ fontSize:16, fontWeight:900, color:isExpired?C.textLight:C.saffron, letterSpacing:1, fontFamily:"'Courier New',monospace" }}>{coupon.code}</div>
          <TypeBadge type={coupon.type}/>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
            <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{coupon.desc}</div>
            <StatusPill active={coupon.isActive} expired={isExpired}/>
          </div>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap", fontSize:12, color:C.textLight, marginBottom:8 }}>
            <span>Min: ₹{coupon.minOrder}</span>
            {coupon.maxDiscount>0 && <span>Max: ₹{coupon.maxDiscount}</span>}
            <span>Expires: {coupon.expiresAt}</span>
            {coupon.usageLimit && <span>Limit: {coupon.usageLimit}</span>}
          </div>
          {/* Usage bar */}
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.textLight, marginBottom:4 }}>
              <span>{coupon.usedCount} uses</span>
              {coupon.usageLimit && <span>{coupon.usageLimit - coupon.usedCount} remaining</span>}
            </div>
            {usagePct !== null && (
              <div style={{ height:4, background:C.border, borderRadius:2, overflow:"hidden" }}>
                <div style={{ width:`${usagePct}%`, height:"100%", background:usagePct>=90?C.red:usagePct>=70?C.marigold:C.green, borderRadius:2, transition:"width 0.5s" }}/>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dashed divider (ticket perforation) */}
      <div style={{ borderTop:`2px dashed ${C.border}`, margin:"0 16px", position:"relative" }}>
        <div style={{ position:"absolute", left:-24, top:-8, width:16, height:16, borderRadius:"50%", background:C.bg }}/>
        <div style={{ position:"absolute", right:-24, top:-8, width:16, height:16, borderRadius:"50%", background:C.bg }}/>
      </div>

      {/* Bottom actions */}
      <div style={{ padding:"12px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={e=>{e.stopPropagation();onEdit(coupon);}} style={{ padding:"6px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.bgHover, color:C.textMid, fontSize:11, fontWeight:600, cursor:"pointer" }}>✏️ Edit</button>
          <button onClick={e=>{e.stopPropagation();onDelete(coupon.id);}} style={{ padding:"6px 12px", borderRadius:8, border:`1px solid ${C.red}22`, background:C.redBg, color:C.red, fontSize:11, fontWeight:600, cursor:"pointer" }}>🗑️ Delete</button>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:11, color:C.textLight }}>{coupon.isActive?"Live":"Paused"}</span>
          <Toggle on={coupon.isActive && !isExpired} onChange={()=>!isExpired&&onToggle(coupon.id)}/>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN CREATE / EDIT FORM ─────────────────────────────────────────────────
const EMPTY_FORM = { code:"", type:"percent", value:"", maxDiscount:"", minOrder:"", usageLimit:"", isActive:true, expiresAt:"", desc:"", applicableTo:"all", category:"", festivalTag:"" };

function CouponForm({ initial, onSave, onCancel }) {
  const [form, setForm]   = useState(initial || EMPTY_FORM);
  const [preview, setPreview] = useState(500); // preview order value
  const upd = (k) => (e) => setForm(v=>({...v,[k]:e.target.value}));
  const disc = calcDiscount({ ...form, value:Number(form.value), maxDiscount:Number(form.maxDiscount)||Infinity, minOrder:Number(form.minOrder)||0 }, preview);

  // Auto-generate code
  const autoCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const code = Array.from({length:8},()=>chars[Math.floor(Math.random()*chars.length)]).join("");
    setForm(v=>({...v,code}));
  };

  return (
    <Card style={{ padding:"24px", border:`1px solid ${C.saffron}33`, background:`${C.saffron}04` }}>
      <div style={{ fontFamily:"'Georgia',serif", fontSize:18, color:C.text, marginBottom:20 }}>
        {initial?.id ? "Edit Coupon" : "Create New Coupon"}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <div>
          {/* Code */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block",fontSize:12,fontWeight:700,color:C.textMid,marginBottom:6,textTransform:"uppercase",letterSpacing:0.5 }}>Coupon Code</label>
            <div style={{ display:"flex", gap:10 }}>
              <input value={form.code} onChange={upd("code")}
                placeholder="e.g. DIWALI20"
                style={{ flex:1, padding:"11px 14px", borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:15, fontWeight:700, color:C.saffron, background:C.saffronBg, outline:"none", letterSpacing:1, fontFamily:"'Courier New',monospace" }}/>
              <button onClick={autoCode} style={{ padding:"11px 16px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bgHover, color:C.textMid, fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>🎲 Auto</button>
            </div>
          </div>

          {/* Type */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block",fontSize:12,fontWeight:700,color:C.textMid,marginBottom:6,textTransform:"uppercase",letterSpacing:0.5 }}>Discount Type</label>
            <div style={{ display:"flex", gap:8 }}>
              {[["percent","% Percentage"],["flat","₹ Flat Off"],["shipping","🚚 Free Shipping"]].map(([k,l])=>(
                <button key={k} onClick={()=>setForm(v=>({...v,type:k}))}
                  style={{ flex:1, padding:"10px 0", borderRadius:10, border:`1.5px solid ${form.type===k?C.saffron:C.border}`, background:form.type===k?C.saffron:"transparent", color:form.type===k?C.white:C.textMid, fontWeight:600, fontSize:12, cursor:"pointer", transition:"all 0.15s" }}>{l}</button>
              ))}
            </div>
          </div>

          {/* Value */}
          {form.type !== "shipping" && (
            <Input label={form.type==="percent"?"Discount %":"Flat Discount (₹)"}
              type="number" value={form.value} onChange={upd("value")}
              placeholder={form.type==="percent"?"e.g. 20":"e.g. 100"}
              suffix={form.type==="percent"?"%":"₹"}/>
          )}
          {form.type==="percent" && (
            <Input label="Max Discount (₹)" type="number" value={form.maxDiscount} onChange={upd("maxDiscount")} placeholder="e.g. 200" prefix="₹" helper="Leave blank for no limit"/>
          )}
        </div>

        <div>
          <Input label="Description" value={form.desc} onChange={upd("desc")} placeholder="e.g. 20% off — Diwali special" helper="Shown to customers"/>
          <Input label="Min Order Value (₹)" type="number" value={form.minOrder} onChange={upd("minOrder")} placeholder="e.g. 499" prefix="₹"/>
          <Input label="Usage Limit" type="number" value={form.usageLimit} onChange={upd("usageLimit")} placeholder="Leave blank for unlimited" helper="Total uses across all customers"/>
          <Input label="Expiry Date" type="date" value={form.expiresAt} onChange={upd("expiresAt")}/>
        </div>
      </div>

      {/* Applicable to */}
      <div style={{ marginBottom:16 }}>
        <label style={{ display:"block",fontSize:12,fontWeight:700,color:C.textMid,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5 }}>Applicable To</label>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {[["all","All Products"],["category","Specific Category"]].map(([k,l])=>(
            <button key={k} onClick={()=>setForm(v=>({...v,applicableTo:k}))}
              style={{ padding:"8px 16px", borderRadius:9, border:`1.5px solid ${form.applicableTo===k?C.saffron:C.border}`, background:form.applicableTo===k?C.saffronBg:"transparent", color:form.applicableTo===k?C.saffron:C.textMid, fontWeight:600, fontSize:12, cursor:"pointer", transition:"all 0.15s" }}>{l}</button>
          ))}
        </div>
        {form.applicableTo==="category" && (
          <select value={form.category} onChange={upd("category")} style={{ marginTop:10, width:"100%", padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:13, color:C.text, background:C.bgHover, outline:"none" }}>
            <option value="">Select category…</option>
            {["puja-samagri","ghee-oils","hawan-materials","phool-pattiya","prashad","idols-books","sugandhit","utensils","festival-kits","vastra-shringar"].map(c=>(
              <option key={c} value={c}>{c.replace(/-/g," ").replace(/\b\w/g,l=>l.toUpperCase())}</option>
            ))}
          </select>
        )}
      </div>

      {/* Festival tag */}
      <div style={{ marginBottom:16 }}>
        <label style={{ display:"block",fontSize:12,fontWeight:700,color:C.textMid,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5 }}>Festival Tag (optional)</label>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {["","Navratri","Diwali","Janmashtami","Shivratri","Ram Navami","Holi","Ganesh Chaturthi"].map(f=>(
            <button key={f} onClick={()=>setForm(v=>({...v,festivalTag:f}))}
              style={{ padding:"7px 14px", borderRadius:999, border:`1.5px solid ${form.festivalTag===f?C.marigold:C.border}`, background:form.festivalTag===f?C.marigoldBg:"transparent", color:form.festivalTag===f?C.gold:C.textMid, fontWeight:600, fontSize:11, cursor:"pointer", transition:"all 0.15s" }}>{f||"None"}</button>
          ))}
        </div>
      </div>

      {/* Active toggle */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", background:C.bgHover, borderRadius:10, marginBottom:20 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:C.text }}>Coupon Status</div>
          <div style={{ fontSize:11, color:C.textLight }}>{form.isActive?"Coupon is live and can be used":"Coupon is paused"}</div>
        </div>
        <Toggle on={form.isActive} onChange={v=>setForm(f=>({...f,isActive:v}))}/>
      </div>

      {/* Live preview */}
      <div style={{ background:C.saffronBg, border:`1px solid ${C.saffron}33`, borderRadius:12, padding:"16px 18px", marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.saffron, marginBottom:10, textTransform:"uppercase", letterSpacing:0.6 }}>💡 Live Preview</div>
        <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:10 }}>
          <span style={{ fontSize:12, color:C.textMid }}>Test with order value:</span>
          <input type="range" min={0} max={5000} step={50} value={preview} onChange={e=>setPreview(Number(e.target.value))} style={{ flex:1, accentColor:C.saffron }}/>
          <span style={{ fontSize:13, fontWeight:700, color:C.text, minWidth:50 }}>₹{preview}</span>
        </div>
        <div style={{ display:"flex", gap:20, fontSize:13 }}>
          <span style={{ color:C.textLight }}>Order: ₹{preview}</span>
          {preview < (Number(form.minOrder)||0)
            ? <span style={{ color:C.red, fontWeight:600 }}>✕ Min order ₹{form.minOrder} not met</span>
            : <><span style={{ color:C.green, fontWeight:700 }}>Discount: -₹{disc}</span><span style={{ color:C.text, fontWeight:700 }}>You pay: ₹{Math.max(0,preview-disc)}</span></>
          }
        </div>
      </div>

      <div style={{ display:"flex", gap:10 }}>
        <button onClick={()=>onSave(form)} style={{ flex:1, padding:"12px", borderRadius:11, border:"none", background:C.saffron, color:C.white, fontWeight:700, fontSize:14, cursor:"pointer" }}>
          {initial?.id?"💾 Save Changes":"✨ Create Coupon"}
        </button>
        <button onClick={onCancel} style={{ padding:"12px 20px", borderRadius:11, border:`1.5px solid ${C.border}`, background:C.white, color:C.textMid, fontWeight:600, fontSize:14, cursor:"pointer" }}>Cancel</button>
      </div>
    </Card>
  );
}

// ─── CUSTOMER COUPON APPLY UI ─────────────────────────────────────────────────
function CustomerCouponApply({ orderValue=799 }) {
  const [input,    setInput]    = useState("");
  const [applied,  setApplied]  = useState(null);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showList, setShowList] = useState(false);

  const publicCoupons = INIT_COUPONS.filter(c=>c.isActive && new Date(c.expiresAt)>=new Date() && (c.usageLimit===null||c.usedCount<c.usageLimit));

  const apply = (code) => {
    setError(""); setLoading(true);
    setTimeout(()=>{
      const coupon = INIT_COUPONS.find(c=>c.code===code.trim().toUpperCase());
      if (!coupon)           { setError("Invalid coupon code. Please check and try again."); setLoading(false); return; }
      if (!coupon.isActive)  { setError("This coupon is currently paused."); setLoading(false); return; }
      if (new Date(coupon.expiresAt)<new Date()) { setError("This coupon has expired."); setLoading(false); return; }
      if (orderValue < coupon.minOrder) { setError(`Minimum order of ₹${coupon.minOrder} required for this coupon.`); setLoading(false); return; }
      setApplied(coupon); setLoading(false); setShowList(false);
    }, 800);
  };

  const disc = applied ? calcDiscount({ ...applied, value:Number(applied.value), maxDiscount:Number(applied.maxDiscount)||Infinity, minOrder:Number(applied.minOrder)||0 }, orderValue) : 0;

  return (
    <div style={{ maxWidth:480, margin:"0 auto" }}>
      <Card style={{ padding:"24px" }}>
        <div style={{ fontFamily:"'Georgia',serif", fontSize:18, color:C.text, marginBottom:4 }}>Apply Coupon</div>
        <div style={{ fontSize:13, color:C.textLight, marginBottom:20 }}>Order value: <strong style={{ color:C.text }}>₹{orderValue}</strong></div>

        {/* Input */}
        {!applied && (
          <>
            <div style={{ display:"flex", gap:10, marginBottom:10 }}>
              <input value={input} onChange={e=>setInput(e.target.value.toUpperCase())}
                onKeyDown={e=>e.key==="Enter"&&apply(input)}
                placeholder="Enter coupon code…"
                style={{ flex:1, padding:"12px 14px", borderRadius:10, border:`1.5px solid ${error?C.red:C.border}`, fontSize:14, fontWeight:700, color:C.saffron, background:C.saffronBg, outline:"none", letterSpacing:1, fontFamily:"'Courier New',monospace" }}/>
              <button onClick={()=>apply(input)} disabled={loading||!input}
                style={{ padding:"12px 20px", borderRadius:10, border:"none", background:input&&!loading?C.saffron:C.border, color:input&&!loading?C.white:C.textLight, fontWeight:700, fontSize:13, cursor:input&&!loading?"pointer":"not-allowed", transition:"all 0.2s", display:"flex",alignItems:"center",gap:6 }}>
                {loading?<span style={{ width:14,height:14,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:C.white,borderRadius:"50%",animation:"spin 0.8s linear infinite",display:"inline-block" }}/>:"Apply"}
              </button>
            </div>
            {error && <p style={{ fontSize:12, color:C.red, fontWeight:600, margin:"0 0 10px" }}>⚠️ {error}</p>}

            {/* Browse coupons toggle */}
            <button onClick={()=>setShowList(v=>!v)} style={{ width:"100%", padding:"10px", borderRadius:10, border:`1.5px dashed ${C.border}`, background:"transparent", color:C.blue, fontWeight:600, fontSize:13, cursor:"pointer" }}>
              🏷️ {showList?"Hide":"Browse"} Available Coupons
            </button>

            {/* Available coupons list */}
            {showList && (
              <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:10 }}>
                {publicCoupons.filter(c=>orderValue>=c.minOrder).map(c=>{
                  const d = calcDiscount({ ...c, value:Number(c.value), maxDiscount:Number(c.maxDiscount)||Infinity, minOrder:Number(c.minOrder)||0 }, orderValue);
                  return (
                    <div key={c.id} style={{ background:C.bgHover, borderRadius:12, padding:"14px 16px", border:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                          <span style={{ fontFamily:"'Courier New',monospace", fontWeight:900, fontSize:14, color:C.saffron }}>{c.code}</span>
                          <TypeBadge type={c.type}/>
                        </div>
                        <div style={{ fontSize:12, color:C.textMid }}>{c.desc}</div>
                        {d>0 && <div style={{ fontSize:12, color:C.green, fontWeight:700, marginTop:2 }}>Save ₹{d} on this order</div>}
                      </div>
                      <button onClick={()=>{setInput(c.code);apply(c.code);}}
                        style={{ padding:"8px 16px", borderRadius:9, border:"none", background:C.saffron, color:C.white, fontWeight:700, fontSize:12, cursor:"pointer", flexShrink:0 }}>Apply</button>
                    </div>
                  );
                })}
                {publicCoupons.filter(c=>orderValue<c.minOrder).length>0 && (
                  <div style={{ fontSize:12, color:C.textLight, textAlign:"center", padding:"8px 0" }}>
                    + {publicCoupons.filter(c=>orderValue<c.minOrder).length} more coupons available on higher order value
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Applied state */}
        {applied && (
          <div style={{ background:C.greenBg, border:`1.5px solid ${C.green}44`, borderRadius:14, padding:"18px 20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <div>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                  <span style={{ fontSize:18 }}>🎉</span>
                  <span style={{ fontFamily:"'Courier New',monospace", fontWeight:900, fontSize:16, color:C.green }}>{applied.code}</span>
                </div>
                <div style={{ fontSize:13, color:C.textMid }}>{applied.desc}</div>
              </div>
              <button onClick={()=>{setApplied(null);setInput("");}} style={{ background:"none", border:"none", color:C.red, cursor:"pointer", fontSize:18 }}>✕</button>
            </div>
            <div style={{ borderTop:`1px solid ${C.green}33`, paddingTop:12, display:"flex", justifyContent:"space-between", fontSize:14 }}>
              <span style={{ color:C.textMid }}>Coupon discount</span>
              <span style={{ fontWeight:700, color:C.green, fontSize:16 }}>-₹{disc}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:15, fontWeight:700, marginTop:6 }}>
              <span style={{ color:C.text }}>You pay</span>
              <span style={{ color:C.saffron }}>₹{orderValue-disc}</span>
            </div>
          </div>
        )}
      </Card>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── ADMIN COUPONS VIEW ───────────────────────────────────────────────────────
function AdminCoupons() {
  const [coupons, setCoupons]   = useState(INIT_COUPONS);
  const [filter,  setFilter]    = useState("All");
  const [search,  setSearch]    = useState("");
  const [showForm,setShowForm]  = useState(false);
  const [editing, setEditing]   = useState(null);
  const [selected,setSelected]  = useState(null);

  const filters = ["All","Active","Paused","Expired","Festival"];
  const isExpired = c => new Date(c.expiresAt) < new Date();

  const filtered = coupons.filter(c=>{
    if (filter==="Active"  && (!c.isActive||isExpired(c))) return false;
    if (filter==="Paused"  && c.isActive)                  return false;
    if (filter==="Expired" && !isExpired(c))               return false;
    if (filter==="Festival"&& !c.festivalTag)              return false;
    if (search && !c.code.includes(search.toUpperCase()) && !c.desc.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggle  = (id) => setCoupons(prev=>prev.map(c=>c.id===id?{...c,isActive:!c.isActive}:c));
  const remove  = (id) => setCoupons(prev=>prev.filter(c=>c.id!==id));
  const save    = (form) => {
    if (editing?.id) {
      setCoupons(prev=>prev.map(c=>c.id===editing.id?{...c,...form}:c));
    } else {
      setCoupons(prev=>[{...form,id:`c${Date.now()}`,usedCount:0,createdAt:new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})},...prev]);
    }
    setShowForm(false); setEditing(null);
  };

  return (
    <div>
      {/* Stats */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24 }}>
        {COUPON_STATS.map(s=>(
          <Card key={s.label} style={{ padding:"16px 18px" }}>
            <div style={{ fontSize:22,marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontSize:22,fontWeight:700,color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11,color:C.textLight }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Form */}
      {(showForm||editing) && (
        <div style={{ marginBottom:24 }}>
          <CouponForm initial={editing} onSave={save} onCancel={()=>{setShowForm(false);setEditing(null);}}/>
        </div>
      )}

      {/* Controls */}
      <div style={{ display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search code or description…"
          style={{ flex:1,minWidth:200,padding:"9px 14px",borderRadius:9,border:`1px solid ${C.border}`,fontSize:13,color:C.text,background:C.bgCard,outline:"none" }}/>
        <div style={{ display:"flex",gap:6 }}>
          {filters.map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{ padding:"8px 14px",borderRadius:999,border:`1.5px solid ${filter===f?C.saffron:C.border}`,background:filter===f?C.saffron:"transparent",color:filter===f?C.white:C.textMid,fontWeight:600,fontSize:12,cursor:"pointer",transition:"all 0.15s" }}>{f}</button>
          ))}
        </div>
        {!showForm&&!editing&&<button onClick={()=>setShowForm(true)} style={{ padding:"9px 18px",borderRadius:10,border:"none",background:C.saffron,color:C.white,fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap" }}>+ Create Coupon</button>}
      </div>

      {/* Coupon grid */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14,marginBottom:24 }}>
        {filtered.map(c=>(
          <CouponTicket key={c.id} coupon={c} selected={selected===c.id} onClick={()=>setSelected(s=>s===c.id?null:c.id)}
            onToggle={toggle} onEdit={(coupon)=>{setEditing(coupon);setShowForm(false);window.scrollTo({top:0,behavior:"smooth"});}} onDelete={remove}/>
        ))}
        {filtered.length===0 && <div style={{ gridColumn:"1/-1",textAlign:"center",padding:"48px 0",color:C.textLight,fontSize:14 }}>No coupons match your filters.</div>}
      </div>

      {/* Selected coupon detail */}
      {selected && (() => {
        const c = coupons.find(x=>x.id===selected);
        if (!c) return null;
        return (
          <Card style={{ padding:"22px" }}>
            <div style={{ fontFamily:"'Georgia',serif",fontSize:17,color:C.text,marginBottom:16 }}>Coupon Analytics — <span style={{ color:C.saffron,fontFamily:"'Courier New',monospace" }}>{c.code}</span></div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14 }}>
              {[
                ["Total Uses",c.usedCount,"👆",C.blue],
                ["Remaining",c.usageLimit?c.usageLimit-c.usedCount:"∞","📦",C.green],
                ["Discount Given",`₹${c.usedCount*(c.type==="flat"?c.value:Math.round(599*c.value/100))}`.replace("NaN","—"),"💸",C.red],
                ["Conversion","8.5%","📈",C.purple],
              ].map(([label,val,icon,color])=>(
                <div key={label} style={{ background:C.bgHover,borderRadius:12,padding:"14px 16px",textAlign:"center" }}>
                  <div style={{ fontSize:22,marginBottom:4 }}>{icon}</div>
                  <div style={{ fontSize:20,fontWeight:700,color }}>{val}</div>
                  <div style={{ fontSize:11,color:C.textLight }}>{label}</div>
                </div>
              ))}
            </div>
          </Card>
        );
      })()}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
const NAV = [
  { id:"admin",    label:"Admin Panel",  icon:"🛠️" },
  { id:"customer", label:"Customer View",icon:"👤" },
];

export default function CouponsModule() {
  const [view, setView] = useState("admin");

  return (
    <div style={{ minHeight:"100vh",display:"flex",fontFamily:"'Segoe UI','Helvetica Neue',sans-serif",background:C.bg }}>

      {/* Sidebar */}
      <div style={{ width:220,flexShrink:0,background:C.sb,borderRight:`1px solid ${C.sbBorder}`,display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh" }}>
        <div style={{ padding:"20px 18px 16px",borderBottom:`1px solid ${C.sbBorder}` }}>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <span style={{ fontSize:20 }}>🏷️</span>
            <div>
              <div style={{ fontFamily:"'Georgia',serif",fontWeight:700,fontSize:14,color:C.sbAccent }}>Coupons</div>
              <div style={{ fontSize:9,color:C.sbDim,letterSpacing:1.4,textTransform:"uppercase" }}>& Offers</div>
            </div>
          </div>
        </div>
        <div style={{ flex:1,padding:"12px 10px" }}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setView(n.id)} style={{ width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 10px",borderRadius:9,border:"none",background:view===n.id?`${C.sbAccent}22`:"transparent",color:view===n.id?C.sbAccent:C.sbText,fontWeight:view===n.id?700:400,fontSize:13,cursor:"pointer",marginBottom:4,transition:"all 0.15s",borderLeft:`3px solid ${view===n.id?C.sbAccent:"transparent"}`,textAlign:"left" }}>
              <span style={{ fontSize:16 }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </div>
        <div style={{ padding:"14px",borderTop:`1px solid ${C.sbBorder}`,fontSize:11,color:C.sbDim,textAlign:"center" }}>
          {INIT_COUPONS.filter(c=>c.isActive).length} active coupons live
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1,overflow:"auto" }}>
        {/* Topbar */}
        <div style={{ background:C.bgCard,borderBottom:`1px solid ${C.border}`,padding:"0 28px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:40 }}>
          <span style={{ fontFamily:"'Georgia',serif",fontSize:16,fontWeight:700,color:C.text }}>
            {view==="admin"?"🛠️ Coupon Management":"👤 Customer — Apply Coupon"}
          </span>
          <div style={{ display:"flex",gap:8 }}>
            <button style={{ padding:"7px 14px",borderRadius:8,border:`1px solid ${C.border}`,background:C.bgHover,color:C.textMid,fontSize:12,fontWeight:600,cursor:"pointer" }}>📥 Export Report</button>
          </div>
        </div>

        <div style={{ padding:"28px" }}>
          {view==="admin"    && <AdminCoupons/>}
          {view==="customer" && (
            <div>
              <div style={{ textAlign:"center",marginBottom:28 }}>
                <h2 style={{ fontFamily:"'Georgia',serif",fontSize:24,color:C.text,margin:"0 0 6px" }}>Customer Coupon Experience</h2>
                <p style={{ fontSize:14,color:C.textLight,margin:0 }}>Preview how customers apply coupons at checkout</p>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:24 }}>
                <div>
                  <div style={{ textAlign:"center",fontSize:13,color:C.textLight,marginBottom:12,fontWeight:600 }}>Order Value: ₹799</div>
                  <CustomerCouponApply orderValue={799}/>
                </div>
                <div>
                  <div style={{ textAlign:"center",fontSize:13,color:C.textLight,marginBottom:12,fontWeight:600 }}>Order Value: ₹350</div>
                  <CustomerCouponApply orderValue={350}/>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}