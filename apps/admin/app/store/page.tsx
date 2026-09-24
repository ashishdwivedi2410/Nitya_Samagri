"use client";

import type React from "react";
import { useState, useEffect } from "react";
import useSWR from "swr";
import RequireAuth from "../_components/RequireAuth";
import { api } from "../_lib/api";

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }) : "";
const cmsFetcher = (url: string) => api.get<{ data: { items: any[] } }>(url).then(r => r.data.items);
const cmsCreate = (resource: string, body: unknown) => api.post(`/api/v1/cms/${resource}`, body);
const cmsUpdate = (resource: string, id: string, body: unknown) => api.patch(`/api/v1/cms/${resource}/${id}`, body);
const cmsDelete = (resource: string, id: string) => api.delete(`/api/v1/cms/${resource}/${id}`);

// ─── THEME: Dark obsidian sidebar + warm ivory content ────────────────────────
const S = {
  // Sidebar — deep obsidian
  sb:        "#0E0C0A",
  sbCard:    "#161310",
  sbBorder:  "#2A2420",
  sbText:    "#C8B89A",
  sbTextDim: "#5A4A38",
  sbAccent:  "#E8560A",

  // Content — warm ivory
  bg:        "#FAF7F2",
  bgCard:    "#FFFFFF",
  bgHover:   "#F5F0E8",
  border:    "#E8DDD0",
  borderLight:"#F0E8DC",

  // Brand
  saffron:   "#E8560A",
  saffronDim:"#F47B3A",
  saffronBg: "#FFF3EC",
  marigold:  "#F5A623",
  marigoldBg:"#FFFBE8",
  gold:      "#C8860A",
  goldBg:    "#FFF8E8",
  cream:     "#FFF8EE",

  // Semantic
  text:      "#1A1208",
  textMid:   "#5C4030",
  textLight: "#9A8070",
  green:     "#1A7A3C",
  greenBg:   "#EDFAF3",
  red:       "#C0392B",
  redBg:     "#FFF0EE",
  blue:      "#1A5C9E",
  blueBg:    "#EEF4FF",
  purple:    "#6B2EA8",
  purpleBg:  "#F5EEFF",
  white:     "#FFFFFF",
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

// ─── SHARED ───────────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const map = {
    active:    { color:S.green,  bg:S.greenBg  },
    scheduled: { color:S.blue,   bg:S.blueBg   },
    draft:     { color:S.textLight,bg:"#F0EBE3" },
    upcoming:  { color:S.marigold,bg:S.marigoldBg},
    completed: { color:S.purple, bg:S.purpleBg  },
    published: { color:S.green,  bg:S.greenBg  },
  };
  const s = map[status] || map.draft;
  return <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:s.bg, color:s.color, fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:999, textTransform:"capitalize" }}><span style={{ width:5, height:5, borderRadius:"50%", background:s.color }}/>{status}</span>;
}

function Card({ children, style={}, onClick, onMouseEnter, onMouseLeave }: {
  children: React.ReactNode; style?: React.CSSProperties; onClick?: (e?: any) => void; onMouseEnter?: (e?: any) => void; onMouseLeave?: (e?: any) => void;
}) {
  return <div onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ background:S.bgCard, borderRadius:14, border:`1px solid ${S.border}`, ...style }}>{children}</div>;
}

function SectionTitle({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
      <div>
        <h2 style={{ fontFamily:"'Georgia',serif", fontSize:22, color:S.text, margin:"0 0 4px" }}>{title}</h2>
        {sub && <p style={{ fontSize:13, color:S.textLight, margin:0 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function Btn({ children, variant="primary", onClick=()=>{}, small=false }: { children: React.ReactNode; variant?: string; onClick?: (e?: any) => void; small?: boolean }) {
  const styles = {
    primary:  { bg:S.saffron,  color:S.white,    border:"none" },
    secondary:{ bg:"transparent", color:S.textMid, border:`1.5px solid ${S.border}` },
    danger:   { bg:S.redBg,    color:S.red,      border:`1.5px solid ${S.red}22` },
    success:  { bg:S.greenBg,  color:S.green,    border:`1.5px solid ${S.green}22` },
  };
  const s = styles[variant] || styles.primary;
  return (
    <button onClick={onClick} style={{ padding:small?"6px 12px":"9px 18px", borderRadius:9, border:s.border, background:s.bg, color:s.color, fontWeight:600, fontSize:small?11:13, cursor:"pointer", transition:"opacity 0.15s" }}
      onMouseEnter={e=>e.currentTarget.style.opacity="0.85"}
      onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
      {children}
    </button>
  );
}

function Toggle({ on, onChange }) {
  return (
    <div onClick={()=>onChange(!on)} style={{ width:40, height:22, borderRadius:11, background:on?S.saffron:S.border, position:"relative", cursor:"pointer", transition:"background 0.2s", flexShrink:0 }}>
      <div style={{ position:"absolute", top:3, left:on?20:3, width:16, height:16, borderRadius:"50%", background:S.white, transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.15)" }}/>
    </div>
  );
}

// ─── HOMEPAGE CMS ─────────────────────────────────────────────────────────────
function HomepageCMS() {
  const { data, mutate } = useSWR("/api/v1/cms/sections", cmsFetcher, { fallbackData: [] });
  const initial = (data || []).map((s: any) => ({ id: s._id, label: s.label, type: s.type, active: s.active, order: s.sortOrder }));
  const [sections, setSections] = useState(initial);
  useEffect(() => { if (data) setSections(initial); }, [data]);
  const [dragging, setDragging] = useState(null);
  const [saved, setSaved] = useState(false);

  const toggleSection = (id) => setSections(prev => prev.map(s => s.id===id ? {...s, active:!s.active} : s));

  const moveUp = (id) => {
    setSections(prev => {
      const idx = prev.findIndex(s=>s.id===id);
      if(idx===0) return prev;
      const next = [...prev];
      [next[idx-1], next[idx]] = [next[idx], next[idx-1]];
      return next;
    });
  };
  const moveDown = (id) => {
    setSections(prev => {
      const idx = prev.findIndex(s=>s.id===id);
      if(idx===prev.length-1) return prev;
      const next = [...prev];
      [next[idx], next[idx+1]] = [next[idx+1], next[idx]];
      return next;
    });
  };

  const save = async () => {
    await Promise.all(sections.map((s: any, i: number) => cmsUpdate("sections", s.id, { active: s.active, sortOrder: i })));
    mutate();
    setSaved(true); setTimeout(()=>setSaved(false), 2000);
  };

  const typeIcon = { banner:"🖼️", festival:"🪔", products:"📦", reviews:"⭐", blog:"📝" };

  return (
    <div>
      <SectionTitle title="Homepage Layout"
        sub="Drag to reorder sections. Toggle to show/hide on the storefront."
        action={<Btn onClick={save}>{saved?"✓ Saved!":"Save Layout"}</Btn>}
      />

      {/* Preview strip */}
      <Card style={{ padding:"16px 20px", marginBottom:24, background:`linear-gradient(135deg, ${S.cream}, #FFF)`, border:`1px solid ${S.saffron}22` }}>
        <div style={{ fontSize:12, fontWeight:700, color:S.saffron, marginBottom:10, textTransform:"uppercase", letterSpacing:0.8 }}>Live Preview Order</div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {sections.filter(s=>s.active).map((s,i)=>(
            <div key={s.id} style={{ display:"flex", alignItems:"center", gap:6, background:S.white, border:`1px solid ${S.border}`, borderRadius:8, padding:"5px 10px", fontSize:12 }}>
              <span style={{ color:S.textLight, fontWeight:700, fontSize:10 }}>{i+1}</span>
              <span>{typeIcon[s.type]}</span>
              <span style={{ color:S.text, fontWeight:500 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Section list */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {sections.map((s,i)=>(
          <Card key={s.id} style={{ padding:"16px 18px", opacity:s.active?1:0.55, transition:"opacity 0.2s", border:`1px solid ${s.active?S.border:S.borderLight}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              {/* Drag handle */}
              <div style={{ display:"flex", flexDirection:"column", gap:2, cursor:"grab", flexShrink:0 }}>
                {[0,1,2].map(r=><div key={r} style={{ width:16, height:2, background:S.textLight, borderRadius:1 }}/>)}
              </div>

              {/* Order badge */}
              <div style={{ width:26, height:26, borderRadius:8, background:s.active?S.saffronBg:S.bgHover, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:s.active?S.saffron:S.textLight, flexShrink:0 }}>{i+1}</div>

              <span style={{ fontSize:22 }}>{typeIcon[s.type]}</span>

              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14, color:S.text }}>{s.label}</div>
                <div style={{ fontSize:11, color:S.textLight, textTransform:"capitalize" }}>Type: {s.type}</div>
              </div>

              {/* Move arrows */}
              <div style={{ display:"flex", gap:4 }}>
                <button onClick={()=>moveUp(s.id)} disabled={i===0} style={{ width:28, height:28, borderRadius:7, border:`1px solid ${S.border}`, background:S.bgHover, cursor:i===0?"not-allowed":"pointer", color:S.textMid, fontSize:13, opacity:i===0?0.3:1 }}>↑</button>
                <button onClick={()=>moveDown(s.id)} disabled={i===sections.length-1} style={{ width:28, height:28, borderRadius:7, border:`1px solid ${S.border}`, background:S.bgHover, cursor:i===sections.length-1?"not-allowed":"pointer", color:S.textMid, fontSize:13, opacity:i===sections.length-1?0.3:1 }}>↓</button>
              </div>

              <Toggle on={s.active} onChange={()=>toggleSection(s.id)}/>
            </div>
          </Card>
        ))}
      </div>

      {/* Disabled sections hint */}
      <div style={{ marginTop:14, padding:"12px 16px", background:S.bgHover, borderRadius:10, fontSize:12, color:S.textLight }}>
        💡 {sections.filter(s=>!s.active).length} section(s) hidden from storefront. Toggle to enable.
      </div>
    </div>
  );
}

// ─── BANNERS ──────────────────────────────────────────────────────────────────
function BannersView() {
  const { data, mutate } = useSWR("/api/v1/cms/banners", cmsFetcher, { fallbackData: [] });
  const banners = (data || []).map((b: any) => ({ id: b._id, title: b.title, desktop: b.desktopEmoji || "🖼️", mobile: b.mobileEmoji || "🖼️", cta: b.cta, url: b.url, status: b.status, start: fmtDate(b.startDate), end: fmtDate(b.endDate), clicks: b.clicks || 0 }));
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:"", cta:"Shop Now", url:"", start:"", end:"", status:"draft" });

  const toggleStatus = async (id) => {
    const b = banners.find(x => x.id === id);
    await cmsUpdate("banners", id, { status: b.status === "active" ? "draft" : "active" });
    mutate();
  };
  const saveBanner = async () => {
    await cmsCreate("banners", { title: form.title, cta: form.cta, url: form.url, status: form.status });
    setForm({ title:"", cta:"Shop Now", url:"", start:"", end:"", status:"draft" });
    setShowForm(false);
    mutate();
  };

  return (
    <div>
      <SectionTitle title="Banner Management"
        sub={`${banners.filter(b=>b.status==="active").length} active banners`}
        action={<Btn onClick={()=>setShowForm(v=>!v)}>+ Add Banner</Btn>}
      />

      {/* Add banner form */}
      {showForm && (
        <Card style={{ padding:"22px", marginBottom:20, border:`1px solid ${S.saffron}33`, background:S.saffronBg }}>
          <div style={{ fontFamily:"'Georgia',serif", fontSize:16, color:S.text, marginBottom:16 }}>New Banner</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            {[["Banner Title","title","text"],["CTA Button Text","cta","text"],["Redirect URL","url","text"],["Status","status","select"]].map(([label,key,type])=>(
              <div key={key}>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:S.textMid, marginBottom:5 }}>{label}</label>
                {type==="select" ? (
                  <select value={form[key]} onChange={e=>setForm(v=>({...v,[key]:e.target.value}))} style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1.5px solid ${S.border}`, fontSize:13, color:S.text, background:S.white, outline:"none", boxSizing:"border-box" }}>
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="active">Active</option>
                  </select>
                ) : (
                  <input type={type} value={form[key]} onChange={e=>setForm(v=>({...v,[key]:e.target.value}))} style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1.5px solid ${S.border}`, fontSize:13, color:S.text, background:S.white, outline:"none", boxSizing:"border-box" }}/>
                )}
              </div>
            ))}
            <div>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:S.textMid, marginBottom:5 }}>Start Date</label>
              <input type="date" style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1.5px solid ${S.border}`, fontSize:13, color:S.text, background:S.white, outline:"none", boxSizing:"border-box" }}/>
            </div>
            <div>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:S.textMid, marginBottom:5 }}>End Date</label>
              <input type="date" style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1.5px solid ${S.border}`, fontSize:13, color:S.text, background:S.white, outline:"none", boxSizing:"border-box" }}/>
            </div>
          </div>
          {/* Image upload areas */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginTop:14 }}>
            {[["🖥️ Desktop Banner (1440×500px)"],["📱 Mobile Banner (800×400px)"]].map(([label])=>(
              <div key={label} style={{ border:`2px dashed ${S.border}`, borderRadius:12, padding:"28px", textAlign:"center", cursor:"pointer", background:S.bgHover }}
                onMouseEnter={e=>e.currentTarget.style.borderColor=S.saffron}
                onMouseLeave={e=>e.currentTarget.style.borderColor=S.border}>
                <div style={{ fontSize:28, marginBottom:8 }}>☁️</div>
                <div style={{ fontSize:12, color:S.textLight, fontWeight:500 }}>{label}</div>
                <div style={{ fontSize:11, color:S.textLight, marginTop:4 }}>Click to upload or drag & drop</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:10, marginTop:16 }}>
            <Btn onClick={saveBanner}>Save Banner</Btn>
            <Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {/* Banner grid */}
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {banners.map(b=>(
          <Card key={b.id} style={{ padding:"18px 20px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              {/* Preview */}
              <div style={{ width:80, height:50, borderRadius:10, background:S.saffronBg, border:`1px solid ${S.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0 }}>{b.desktop}</div>

              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                  <span style={{ fontWeight:700, fontSize:15, color:S.text }}>{b.title}</span>
                  <StatusPill status={b.status}/>
                </div>
                <div style={{ display:"flex", gap:16, fontSize:12, color:S.textLight }}>
                  <span>CTA: <strong style={{ color:S.textMid }}>{b.cta}</strong></span>
                  <span>URL: <strong style={{ color:S.blue }}>{b.url}</strong></span>
                  <span>📅 {b.start} → {b.end}</span>
                  {b.clicks>0 && <span>👆 {b.clicks.toLocaleString()} clicks</span>}
                </div>
              </div>

              {/* Mobile preview badge */}
              <div style={{ width:36, height:50, borderRadius:6, background:S.bgHover, border:`1px solid ${S.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{b.mobile}</div>

              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <Toggle on={b.status==="active"} onChange={()=>toggleStatus(b.id)}/>
                <Btn variant="secondary" small onClick={()=>setEditing(b.id)}>Edit</Btn>
                <Btn variant="danger" small>Delete</Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── FESTIVAL CAMPAIGNS ───────────────────────────────────────────────────────
function FestivalsView() {
  const { data } = useSWR("/api/v1/cms/festivals", cmsFetcher, { fallbackData: [] });
  const festivals = (data || []).map((f: any) => ({ id: f._id, name: f.name, icon: f.icon || "🪔", color: f.color || S.saffron, status: f.status, start: fmtDate(f.startDate), end: fmtDate(f.endDate), products: (f.productIds||[]).length, revenue: f.revenue || 0 }));
  const [selected, setSelected] = useState<any | null>(null);
  const [showNew, setShowNew] = useState(false);

  return (
    <div>
      <SectionTitle title="Festival Campaigns"
        sub="Create seasonal campaigns with products & discounts"
        action={<Btn onClick={()=>setShowNew(v=>!v)}>+ New Campaign</Btn>}
      />

      {/* New campaign form */}
      {showNew && (
        <Card style={{ padding:"22px", marginBottom:20, border:`1px solid ${S.marigold}44`, background:S.marigoldBg }}>
          <div style={{ fontFamily:"'Georgia',serif", fontSize:16, color:S.text, marginBottom:16 }}>New Festival Campaign</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
            {[["Festival Name","text"],["Festival Icon (emoji)","text"],["Theme Color","color"],["Start Date","date"],["End Date","date"],["Status","select"]].map(([label,type],i)=>(
              <div key={i}>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:S.textMid, marginBottom:5 }}>{label}</label>
                {type==="select" ? (
                  <select style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1.5px solid ${S.border}`, fontSize:13, color:S.text, background:S.white, outline:"none", boxSizing:"border-box" }}>
                    <option>Draft</option><option>Upcoming</option><option>Active</option>
                  </select>
                ) : (
                  <input type={type} style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1.5px solid ${S.border}`, fontSize:13, color:S.text, background:S.white, outline:"none", boxSizing:"border-box" }}/>
                )}
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:10, marginTop:16 }}>
            <Btn>Create Campaign</Btn>
            <Btn variant="secondary" onClick={()=>setShowNew(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {/* Festival cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:20 }}>
        {festivals.map(f=>(
          <Card key={f.id} style={{ padding:"20px", cursor:"pointer", border:`1px solid ${selected?.id===f.id?f.color:S.border}`, transition:"all 0.15s" }}
            onClick={()=>setSelected(selected?.id===f.id?null:f)}
            onMouseEnter={e=>{ if(selected?.id!==f.id) e.currentTarget.style.borderColor=f.color+"66"; }}
            onMouseLeave={e=>{ if(selected?.id!==f.id) e.currentTarget.style.borderColor=S.border; }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <div style={{ fontSize:36 }}>{f.icon}</div>
              <StatusPill status={f.status}/>
            </div>
            <div style={{ fontFamily:"'Georgia',serif", fontSize:17, color:S.text, marginBottom:4 }}>{f.name}</div>
            <div style={{ fontSize:12, color:S.textLight, marginBottom:14 }}>📅 {f.startDate} → {f.endDate}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[["📦 Products",f.products],["🎟️ Coupons",2]].map(([label,val])=>(
                <div key={label} style={{ background:S.bgHover, borderRadius:8, padding:"8px 10px", textAlign:"center" }}>
                  <div style={{ fontSize:14, fontWeight:700, color:S.text }}>{val}</div>
                  <div style={{ fontSize:10, color:S.textLight }}>{label}</div>
                </div>
              ))}
            </div>
            {f.revenue>0 && (
              <div style={{ marginTop:10, padding:"8px 10px", background:S.goldBg, borderRadius:8, textAlign:"center" }}>
                <span style={{ fontSize:13, fontWeight:700, color:S.gold }}>₹{(f.revenue/100000).toFixed(1)}L revenue</span>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Selected campaign detail */}
      {selected && (
        <Card style={{ padding:"24px", border:`1px solid ${selected.color}44`, background:`${selected.color}06` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <div style={{ display:"flex", gap:12, alignItems:"center" }}>
              <span style={{ fontSize:32 }}>{selected.icon}</span>
              <div>
                <div style={{ fontFamily:"'Georgia',serif", fontSize:20, color:S.text }}>{selected.name}</div>
                <div style={{ fontSize:12, color:S.textLight }}>{selected.startDate} → {selected.endDate}</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <Btn>Edit Campaign</Btn>
              <Btn variant="secondary">Preview Page</Btn>
              <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:S.textLight }}>✕</button>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
            {[
              { label:"Featured Products", value:selected.products, action:"Manage Products", icon:"📦" },
              { label:"Social Posts",      value:5,                 action:"Schedule Posts",  icon:"📱" },
              { label:"Active Banners",    value:2,                 action:"Edit Banners",    icon:"🖼️" },
              { label:"Active Coupons",    value:3,                 action:"Edit Coupons",    icon:"🏷️" },
            ].map(item=>(
              <div key={item.label} style={{ background:S.bgCard, borderRadius:12, padding:"16px", border:`1px solid ${S.border}`, textAlign:"center" }}>
                <div style={{ fontSize:28, marginBottom:6 }}>{item.icon}</div>
                <div style={{ fontSize:24, fontWeight:700, color:S.text }}>{item.value}</div>
                <div style={{ fontSize:11, color:S.textLight, marginBottom:10 }}>{item.label}</div>
                <Btn variant="secondary" small>{item.action}</Btn>
              </div>
            ))}
          </div>

          {/* SEO + discount settings */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginTop:16 }}>
            <div style={{ background:S.bgCard, borderRadius:12, padding:"16px", border:`1px solid ${S.border}` }}>
              <div style={{ fontSize:13, fontWeight:700, color:S.text, marginBottom:12 }}>🏷️ Campaign Discount</div>
              {[["Discount Type","Percentage (%)"],["Discount Value","20%"],["Min Order Value","₹500"],["Coupon Code","NAVRATRI20"]].map(([k,v])=>(
                <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:8, fontSize:12 }}>
                  <span style={{ color:S.textLight }}>{k}</span>
                  <span style={{ fontWeight:700, color:S.text }}>{v}</span>
                </div>
              ))}
              <Btn variant="secondary" small>Edit Discount</Btn>
            </div>
            <div style={{ background:S.bgCard, borderRadius:12, padding:"16px", border:`1px solid ${S.border}` }}>
              <div style={{ fontSize:13, fontWeight:700, color:S.text, marginBottom:12 }}>🔍 SEO Settings</div>
              {[["Page Title",`${selected.name} | nityasamagri`],["Meta Desc","Shop festival products..."],["Slug",`/${selected.name.toLowerCase().replace(/ /g,"-")}`]].map(([k,v])=>(
                <div key={k} style={{ marginBottom:8 }}>
                  <div style={{ fontSize:10, color:S.textLight, fontWeight:700, marginBottom:2 }}>{k}</div>
                  <div style={{ fontSize:12, color:S.text }}>{v}</div>
                </div>
              ))}
              <Btn variant="secondary" small>Edit SEO</Btn>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── BLOG ─────────────────────────────────────────────────────────────────────
function BlogView() {
  const { data, mutate } = useSWR("/api/v1/cms/blogs", cmsFetcher, { fallbackData: [] });
  const blogs = (data || []).map((b: any) => ({ id: b._id, title: b.title, category: b.category || "Products", excerpt: b.excerpt || "", author: b.author || "Admin", status: b.status === "published" ? "Published" : "Draft", views: b.views || 0, date: fmtDate(b.publishedAt || b.createdAt) }));
  const [filter, setFilter] = useState("All");
  const [writing, setWriting] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");

  const slug = (draftTitle||"post-title").toLowerCase().replace(/[^a-z0-9]+/g,"-");
  const publish = async (status: "draft" | "published") => {
    await cmsCreate("blogs", { title: draftTitle, slug, content: draftBody, status });
    setDraftTitle(""); setDraftBody(""); setWriting(false);
    mutate();
  };

  const categories = ["All","Festivals","Products","Ceremonies","Spirituality"];
  const filtered = filter==="All" ? blogs : blogs.filter(b=>b.category===filter);

  return (
    <div>
      <SectionTitle title="Blog Management"
        sub="Create SEO content to drive organic traffic"
        action={<Btn onClick={()=>setWriting(v=>!v)}>+ New Post</Btn>}
      />

      {/* Editor */}
      {writing && (
        <Card style={{ padding:"24px", marginBottom:20, border:`1px solid ${S.blue}33` }}>
          <div style={{ fontFamily:"'Georgia',serif", fontSize:16, color:S.text, marginBottom:16 }}>New Blog Post</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:14 }}>
            {[["Category","select"],["Author","text"],["Status","select2"]].map(([label,type])=>(
              <div key={label}>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:S.textMid, marginBottom:5 }}>{label}</label>
                <select style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1.5px solid ${S.border}`, fontSize:13, color:S.text, background:S.white, outline:"none", boxSizing:"border-box" }}>
                  {label==="Category" && categories.slice(1).map(c=><option key={c}>{c}</option>)}
                  {label==="Status" && ["Draft","Published"].map(s=><option key={s}>{s}</option>)}
                  {label==="Author" && <option>Admin</option>}
                </select>
              </div>
            ))}
          </div>
          <input value={draftTitle} onChange={e=>setDraftTitle(e.target.value)} placeholder="Post title…"
            style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:`1.5px solid ${S.border}`, fontSize:18, fontFamily:"'Georgia',serif", color:S.text, background:S.bgHover, outline:"none", marginBottom:12, boxSizing:"border-box" }}/>
          <textarea value={draftBody} onChange={e=>setDraftBody(e.target.value)} placeholder="Write your post content here…" rows={8}
            style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:`1.5px solid ${S.border}`, fontSize:14, color:S.text, background:S.bgHover, outline:"none", resize:"vertical", lineHeight:1.7, boxSizing:"border-box" }}/>
          {/* SEO preview */}
          <div style={{ marginTop:14, padding:"14px 16px", background:S.bgHover, borderRadius:10, border:`1px solid ${S.border}` }}>
            <div style={{ fontSize:11, fontWeight:700, color:S.textLight, marginBottom:8, textTransform:"uppercase", letterSpacing:0.6 }}>SEO Preview</div>
            <div style={{ fontSize:16, color:S.blue, fontWeight:600, marginBottom:2 }}>{draftTitle || "Post title will appear here"}</div>
            <div style={{ fontSize:12, color:S.green, marginBottom:4 }}>nityasamagri.in/blog/{(draftTitle||"post-title").toLowerCase().replace(/[^a-z0-9]+/g,"-")}</div>
            <div style={{ fontSize:13, color:S.textMid }}>Meta description will be auto-generated from the first 160 characters of your content.</div>
          </div>
          <div style={{ display:"flex", gap:10, marginTop:14 }}>
            <Btn onClick={()=>publish("published")}>Publish Post</Btn>
            <Btn variant="secondary" onClick={()=>publish("draft")}>Save Draft</Btn>
            <Btn variant="secondary" onClick={()=>setWriting(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {/* Filter tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:20 }}>
        {categories.map(c=>(
          <button key={c} onClick={()=>setFilter(c)} style={{ padding:"7px 16px", borderRadius:999, border:`1.5px solid ${filter===c?S.saffron:S.border}`, background:filter===c?S.saffron:"transparent", color:filter===c?S.white:S.textMid, fontWeight:600, fontSize:12, cursor:"pointer", transition:"all 0.15s" }}>{c}</button>
        ))}
      </div>

      {/* Blog list */}
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {filtered.map(b=>(
          <Card key={b.id} style={{ padding:"18px 20px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                  <span style={{ fontWeight:700, fontSize:15, color:S.text }}>{b.title}</span>
                  <StatusPill status={b.status}/>
                  <span style={{ fontSize:11, color:S.textLight, background:S.bgHover, padding:"2px 8px", borderRadius:999 }}>{b.category}</span>
                </div>
                <div style={{ display:"flex", gap:14, fontSize:12, color:S.textLight }}>
                  <span>✍️ {b.author}</span>
                  <span>📅 {b.date}</span>
                  {b.views>0 && <span>👁 {b.views.toLocaleString()} views</span>}
                  <span style={{ display:"flex", gap:4 }}>{b.tags.map(t=><span key={t} style={{ background:S.saffronBg, color:S.saffron, padding:"1px 7px", borderRadius:999, fontSize:10, fontWeight:700 }}>#{t}</span>)}</span>
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <Btn variant="secondary" small>Edit</Btn>
                {b.status==="draft" && <Btn variant="success" small>Publish</Btn>}
                {b.status==="published" && <Btn variant="secondary" small>Unpublish</Btn>}
                <Btn variant="danger" small>Delete</Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── SEO ──────────────────────────────────────────────────────────────────────
function SEOView() {
  const { data, mutate } = useSWR("/api/v1/cms/seo-pages", cmsFetcher, { fallbackData: [] });
  const pages = (data || []).map((p: any) => ({ id: p._id, page: p.page, title: p.title, desc: p.desc || "", score: p.score ?? 0 }));
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<{ title?: string; desc?: string }>({});

  const scoreColor = s => s>=90?S.green:s>=75?S.marigold:S.red;
  const startEdit = (p) => { setEditing(p.id); setForm({ title:p.title, desc:p.desc }); };
  const saveEdit = async (id: string) => { await cmsUpdate("seo-pages", id, form); setEditing(null); mutate(); };

  return (
    <div>
      <SectionTitle title="SEO & Metadata"
        sub="Manage page titles, descriptions and keywords for better search rankings"
      />

      {/* Global SEO health */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        {[
          { label:"Avg SEO Score", value:`${Math.round(pages.reduce((s,p)=>s+p.score,0)/pages.length)}%`, color:S.green },
          { label:"Pages Optimised", value:`${pages.filter(p=>p.score>=80).length}/${pages.length}`, color:S.blue },
          { label:"Sitemap",  value:"Generated", color:S.green },
          { label:"Robots.txt", value:"Configured", color:S.green },
        ].map(s=>(
          <Card key={s.label} style={{ padding:"14px 16px" }}>
            <div style={{ fontSize:20, fontWeight:700, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:S.textLight, marginTop:2 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Page SEO list */}
      <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:24 }}>
        {pages.map(p=>(
          <Card key={p.id} style={{ padding:"18px 20px" }}>
            {editing===p.id ? (
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:S.text, marginBottom:12 }}>{p.page}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <div>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:S.textLight, marginBottom:4 }}>META TITLE ({form.title?.length||0}/60)</label>
                    <input value={form.title} onChange={e=>setForm(v=>({...v,title:e.target.value}))} style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1.5px solid ${S.border}`, fontSize:13, color:S.text, background:S.bgHover, outline:"none", boxSizing:"border-box" }}/>
                  </div>
                  <div>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:S.textLight, marginBottom:4 }}>META DESCRIPTION ({form.desc?.length||0}/160)</label>
                    <textarea value={form.desc} onChange={e=>setForm(v=>({...v,desc:e.target.value}))} rows={2} style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1.5px solid ${S.border}`, fontSize:13, color:S.text, background:S.bgHover, outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, marginTop:10 }}>
                  <Btn small onClick={()=>saveEdit(p.id)}>Save</Btn>
                  <Btn variant="secondary" small onClick={()=>setEditing(null)}>Cancel</Btn>
                </div>
              </div>
            ) : (
              <div style={{ display:"flex", alignItems:"flex-start", gap:16 }}>
                {/* Score ring */}
                <div style={{ width:48, height:48, borderRadius:"50%", border:`3px solid ${scoreColor(p.score)}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:scoreColor(p.score) }}>{p.score}</span>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:S.text, marginBottom:4 }}>{p.page}</div>
                  <div style={{ fontSize:13, color:S.blue, marginBottom:2 }}>{p.title}</div>
                  <div style={{ fontSize:12, color:S.textMid }}>{p.desc}</div>
                </div>
                <Btn variant="secondary" small onClick={()=>startEdit(p)}>Edit</Btn>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Technical SEO */}
      <Card style={{ padding:"22px" }}>
        <div style={{ fontFamily:"'Georgia',serif", fontSize:17, color:S.text, marginBottom:16 }}>Technical SEO</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
          {[
            { label:"Sitemap.xml",    desc:"Auto-generated, updated daily",           status:"active",  action:"View Sitemap"   },
            { label:"Robots.txt",     desc:"Search engines allowed, admin blocked",    status:"active",  action:"Edit Rules"     },
            { label:"Canonical URLs", desc:"Self-referencing canonicals on all pages", status:"active",  action:"Configure"      },
            { label:"Open Graph",     desc:"Social sharing cards for all pages",       status:"active",  action:"Edit Images"    },
            { label:"Twitter Cards",  desc:"Twitter preview cards configured",         status:"active",  action:"Edit Cards"     },
            { label:"Schema Markup",  desc:"Product & LocalBusiness schema active",    status:"active",  action:"View Schema"    },
          ].map(item=>(
            <div key={item.label} style={{ background:S.bgHover, borderRadius:12, padding:"14px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                <span style={{ fontWeight:700, fontSize:13, color:S.text }}>{item.label}</span>
                <StatusPill status={item.status}/>
              </div>
              <div style={{ fontSize:12, color:S.textLight, marginBottom:10 }}>{item.desc}</div>
              <Btn variant="secondary" small>{item.action}</Btn>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────
function AnnouncementsView() {
  const { data, mutate } = useSWR("/api/v1/cms/announcements", cmsFetcher, { fallbackData: [] });
  const announcements = (data || []).map((a: any) => ({ id: a._id, text: a.text, active: a.active, bg: a.bg || S.saffron, color: a.color || "#fff" }));
  const [showNew, setShowNew] = useState(false);
  const [newText, setNewText] = useState("");
  const [newBg, setNewBg] = useState(S.saffron);

  const toggle = async (id) => {
    const a = announcements.find(x => x.id === id);
    await cmsUpdate("announcements", id, { active: !a.active });
    mutate();
  };
  const addAnnouncement = async () => {
    await cmsCreate("announcements", { text: newText, bg: newBg, active: true });
    setNewText(""); setShowNew(false);
    mutate();
  };

  return (
    <div>
      <SectionTitle title="Announcement Bar"
        sub="Top-of-site notices shown to all visitors"
        action={<Btn onClick={()=>setShowNew(v=>!v)}>+ New Announcement</Btn>}
      />

      {/* Preview */}
      <Card style={{ padding:0, marginBottom:20, overflow:"hidden", border:`1px solid ${S.saffron}33` }}>
        <div style={{ fontSize:11, fontWeight:700, color:S.textLight, padding:"8px 14px", background:S.bgHover, borderBottom:`1px solid ${S.border}`, textTransform:"uppercase", letterSpacing:0.8 }}>Live Preview</div>
        {announcements.filter(a=>a.active).map(a=>(
          <div key={a.id} style={{ background:a.bg, color:a.color, textAlign:"center", padding:"9px 20px", fontSize:13, fontWeight:500 }}>{a.text}</div>
        ))}
        {announcements.filter(a=>a.active).length===0 && <div style={{ padding:"14px", textAlign:"center", color:S.textLight, fontSize:13 }}>No active announcements</div>}
      </Card>

      {/* New form */}
      {showNew && (
        <Card style={{ padding:"20px", marginBottom:20, border:`1px solid ${S.border}`, background:S.saffronBg }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr auto auto auto", gap:12, alignItems:"end" }}>
            <div>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:S.textMid, marginBottom:5 }}>Announcement Text</label>
              <input value={newText} onChange={e=>setNewText(e.target.value)} placeholder="e.g. 🚚 Free delivery above ₹499"
                style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1.5px solid ${S.border}`, fontSize:13, color:S.text, background:S.white, outline:"none", boxSizing:"border-box" }}/>
            </div>
            <div>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:S.textMid, marginBottom:5 }}>Background</label>
              <input type="color" value={newBg} onChange={e=>setNewBg(e.target.value)} style={{ width:44, height:38, borderRadius:8, border:`1.5px solid ${S.border}`, cursor:"pointer", padding:2 }}/>
            </div>
            <div>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:S.textMid, marginBottom:5 }}>Start</label>
              <input type="date" style={{ padding:"9px 10px", borderRadius:9, border:`1.5px solid ${S.border}`, fontSize:12, color:S.text, background:S.white, outline:"none" }}/>
            </div>
            <div>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:S.textMid, marginBottom:5 }}>End</label>
              <input type="date" style={{ padding:"9px 10px", borderRadius:9, border:`1.5px solid ${S.border}`, fontSize:12, color:S.text, background:S.white, outline:"none" }}/>
            </div>
          </div>
          {/* Preview */}
          {newText && (
            <div style={{ marginTop:12, background:newBg, color:S.white, textAlign:"center", padding:"9px", borderRadius:8, fontSize:13, fontWeight:500 }}>{newText}</div>
          )}
          <div style={{ display:"flex", gap:10, marginTop:12 }}>
            <Btn onClick={addAnnouncement}>Add Announcement</Btn>
            <Btn variant="secondary" onClick={()=>setShowNew(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {/* Announcements list */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {announcements.map(a=>(
          <Card key={a.id} style={{ padding:"16px 18px", opacity:a.active?1:0.6 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              {/* Color swatch */}
              <div style={{ width:36, height:36, borderRadius:8, background:a.bg, flexShrink:0, border:`1px solid ${S.border}` }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14, color:S.text, marginBottom:3 }}>{a.text}</div>
                <div style={{ fontSize:11, color:S.textLight }}>📅 {a.start} → {a.end}</div>
              </div>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <span style={{ fontSize:12, color:a.active?S.green:S.textLight, fontWeight:600 }}>{a.active?"● Live":"○ Paused"}</span>
                <Toggle on={a.active} onChange={()=>toggle(a.id)}/>
                <Btn variant="secondary" small>Edit</Btn>
                <Btn variant="danger" small>Delete</Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── NAV + ROOT ───────────────────────────────────────────────────────────────
const NAV = [
  { id:"homepage",      label:"Homepage CMS",   icon:"🏠", group:"Content"  },
  { id:"banners",       label:"Banners",         icon:"🖼️", group:"Content"  },
  { id:"festivals",     label:"Festival Campaigns",icon:"🪔",group:"Content" },
  { id:"blog",          label:"Blog & Articles", icon:"📝", group:"Content"  },
  { id:"seo",           label:"SEO & Metadata",  icon:"🔍", group:"Settings" },
  { id:"announcements", label:"Announcements",   icon:"📢", group:"Settings" },
];

export default function StoreManagement() {
  const [view, setView] = useState("homepage");
  const cur = NAV.find(n=>n.id===view);
  const groups = [...new Set(NAV.map(n=>n.group))];

  return (
    <RequireAuth>
    <div style={{ minHeight:"100vh", display:"flex", fontFamily:"'Segoe UI','Helvetica Neue',sans-serif", background:S.bg }}>

      {/* ── Dark Sidebar ── */}
      <div style={{ width:230, flexShrink:0, background:S.sb, borderRight:`1px solid ${S.sbBorder}`, display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh", overflowY:"auto" }}>
        {/* Logo */}
        <div style={{ padding:"20px 18px 16px", borderBottom:`1px solid ${S.sbBorder}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:20 }}>🪔</span>
            <div>
              <div style={{ fontFamily:"'Georgia',serif", fontWeight:700, fontSize:14, color:S.sbAccent }}>nityasamagri</div>
              <div style={{ fontSize:9, color:S.sbTextDim, letterSpacing:1.4, textTransform:"uppercase" }}>Store Manager</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex:1, padding:"12px 10px" }}>
          {groups.map(group=>(
            <div key={group} style={{ marginBottom:20 }}>
              <div style={{ fontSize:9, fontWeight:700, color:S.sbTextDim, textTransform:"uppercase", letterSpacing:1.4, padding:"0 8px", marginBottom:6 }}>{group}</div>
              {NAV.filter(n=>n.group===group).map(n=>(
                <button key={n.id} onClick={()=>setView(n.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 10px", borderRadius:9, border:"none", background:view===n.id?`${S.sbAccent}22`:"transparent", color:view===n.id?S.sbAccent:S.sbText, fontWeight:view===n.id?700:400, fontSize:13, cursor:"pointer", marginBottom:2, transition:"all 0.15s", borderLeft:`3px solid ${view===n.id?S.sbAccent:"transparent"}`, textAlign:"left" }}>
                  <span style={{ fontSize:15 }}>{n.icon}</span>
                  {n.label}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Back to admin */}
        <div style={{ padding:"14px 16px", borderTop:`1px solid ${S.sbBorder}` }}>
          <button style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"9px 10px", borderRadius:9, border:`1px solid ${S.sbBorder}`, background:"transparent", color:S.sbTextDim, fontSize:12, fontWeight:500, cursor:"pointer" }}>
            ← Back to Admin Panel
          </button>
        </div>
      </div>

      {/* ── Light Content ── */}
      <div style={{ flex:1, overflow:"auto" }}>
        {/* Top bar */}
        <div style={{ background:S.bgCard, borderBottom:`1px solid ${S.border}`, padding:"0 28px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:40 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:18 }}>{cur?.icon}</span>
            <span style={{ fontFamily:"'Georgia',serif", fontSize:16, fontWeight:700, color:S.text }}>{cur?.label}</span>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button style={{ padding:"7px 14px", borderRadius:8, border:`1px solid ${S.border}`, background:S.bgHover, color:S.textMid, fontSize:12, fontWeight:600, cursor:"pointer" }}>👁 Preview Store</button>
            <div style={{ width:32, height:32, borderRadius:"50%", background:S.saffronBg, border:`2px solid ${S.saffron}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:S.saffron }}>SM</div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ padding:"28px" }}>
          {view==="homepage"      && <HomepageCMS/>}
          {view==="banners"       && <BannersView/>}
          {view==="festivals"     && <FestivalsView/>}
          {view==="blog"          && <BlogView/>}
          {view==="seo"           && <SEOView/>}
          {view==="announcements" && <AnnouncementsView/>}
        </div>
      </div>
    </div>
    </RequireAuth>
  );
}