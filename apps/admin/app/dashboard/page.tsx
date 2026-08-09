"use client";

import { useState } from "react";
import RequireAuth from "../_components/RequireAuth";
import { clearAdminSession } from "../_lib/adminAuth";
import { useRouter } from "next/navigation";

// ─── THEME: Obsidian + Saffron — dark professional with warm accent ───────────
const C = {
  bg:         "#0D0D0F",
  bgCard:     "#141416",
  bgElevated: "#1A1A1E",
  bgHover:    "#1F1F24",
  saffron:    "#E8560A",
  saffronDim: "#A83D07",
  saffronBg:  "#1A0A04",
  marigold:   "#F5A623",
  marigoldBg: "#1A1100",
  gold:       "#D4A017",
  goldBg:     "#151000",
  green:      "#22C55E",
  greenBg:    "#071A0F",
  red:        "#EF4444",
  redBg:      "#1A0707",
  blue:       "#3B82F6",
  blueBg:     "#070F1A",
  purple:     "#A855F7",
  purpleBg:   "#100718",
  text:       "#F1F0EE",
  textMid:    "#9A9890",
  textLight:  "#5A5856",
  border:     "#242428",
  borderLight:"#2E2E34",
  white:      "#FFFFFF",
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const OVERVIEW_STATS = [
  { label:"Revenue (Month)",   value:"₹4.82L",  sub:"+18% vs May",   trend:+18, icon:"💰", color:C.saffron,  bg:C.saffronBg },
  { label:"Total Orders",      value:"1,284",   sub:"↑ 142 today",   trend:+12, icon:"📦", color:C.blue,     bg:C.blueBg    },
  { label:"Active Customers",  value:"8,921",   sub:"+56 new today", trend:+8,  icon:"👥", color:C.green,    bg:C.greenBg   },
  { label:"Avg Order Value",   value:"₹876",    sub:"+₹42 vs May",  trend:+5,  icon:"📊", color:C.marigold, bg:C.marigoldBg},
  { label:"Pending Orders",    value:"87",      sub:"15 urgent",     trend:-3,  icon:"⏳", color:C.red,      bg:C.redBg     },
];

const REVENUE_CHART = [
  { month:"Jan", rev:420000, orders:520  },
  { month:"Feb", rev:510000, orders:640  },
  { month:"Mar", rev:480000, orders:600  },
  { month:"Apr", rev:620000, orders:780  },
  { month:"May", rev:408000, orders:510  },
  { month:"Jun", rev:482000, orders:612  },
];

const ORDER_STATUS_DIST = [
  { label:"Pending",        count:87,  color:C.marigold },
  { label:"Confirmed",      count:143, color:C.blue     },
  { label:"Packed",         count:58,  color:C.purple   },
  { label:"Shipped",        count:312, color:C.saffron  },
  { label:"Delivered",      count:645, color:C.green    },
  { label:"Cancelled",      count:39,  color:C.red      },
];

const RECENT_ORDERS = [
  { id:"#ORD-2026-1999", customer:"Rahul Sharma",    city:"Delhi",   amount:798,  status:"Shipped",   payment:"UPI",       items:2, time:"10:32 AM", icon:"🫙" },
  { id:"#ORD-2026-1998", customer:"Priya Verma",     city:"Jaipur",  amount:499,  status:"Delivered", payment:"Razorpay",  items:1, time:"9:15 AM",  icon:"🪔" },
  { id:"#ORD-2026-1997", customer:"Amit Singh",      city:"Noida",   amount:1249, status:"Pending",   payment:"COD",       items:3, time:"8:48 AM",  icon:"📿" },
  { id:"#ORD-2026-1996", customer:"Sunita Mehta",    city:"Mumbai",  amount:349,  status:"Confirmed", payment:"Razorpay",  items:1, time:"8:02 AM",  icon:"🪬" },
  { id:"#ORD-2026-1995", customer:"Vikram Pandey",   city:"Lucknow", amount:688,  status:"Packed",    payment:"UPI",       items:2, time:"7:55 AM",  icon:"🏺" },
  { id:"#ORD-2026-1994", customer:"Neha Agarwal",    city:"Delhi",   amount:299,  status:"Cancelled", payment:"UPI",       items:1, time:"7:30 AM",  icon:"🫙" },
  { id:"#ORD-2026-1993", customer:"Rohit Sharma",    city:"Agra",    amount:1599, status:"Shipped",   payment:"Card",      items:4, time:"7:12 AM",  icon:"🪷" },
  { id:"#ORD-2026-1992", customer:"Kavita Joshi",    city:"Delhi",   amount:549,  status:"Delivered", payment:"Razorpay",  items:2, time:"6:58 AM",  icon:"🕯️" },
];

const USERS = [
  { id:"C001", name:"Rahul Sharma",  email:"rahul@gmail.com",   phone:"+91 98765 43210", city:"Delhi",   orders:18, spend:14820, status:"Active",   tier:"Gold",     joined:"Mar 2024", lastOrder:"28 May 2026", avatar:"R" },
  { id:"C002", name:"Priya Verma",   email:"priya@gmail.com",   phone:"+91 87654 32109", city:"Jaipur",  orders:7,  spend:5420,  status:"Active",   tier:"Silver",   joined:"Jun 2024", lastOrder:"31 May 2026", avatar:"P" },
  { id:"C003", name:"Amit Singh",    email:"amit@gmail.com",    phone:"+91 76543 21098", city:"Noida",   orders:32, spend:28400, status:"Active",   tier:"Platinum", joined:"Jan 2024", lastOrder:"30 May 2026", avatar:"A" },
  { id:"C004", name:"Sunita Mehta",  email:"sunita@gmail.com",  phone:"+91 65432 10987", city:"Mumbai",  orders:3,  spend:1250,  status:"Active",   tier:"New",      joined:"May 2026", lastOrder:"29 May 2026", avatar:"S" },
  { id:"C005", name:"Vikram Pandey", email:"vikram@gmail.com",  phone:"+91 54321 09876", city:"Lucknow", orders:0,  spend:0,     status:"Inactive", tier:"New",      joined:"Apr 2026", lastOrder:"—",           avatar:"V" },
  { id:"C006", name:"Neha Agarwal",  email:"neha@gmail.com",    phone:"+91 43210 98765", city:"Delhi",   orders:11, spend:8900,  status:"Active",   tier:"Silver",   joined:"Nov 2023", lastOrder:"28 May 2026", avatar:"N" },
  { id:"C007", name:"Rohit Mehta",   email:"rohit@gmail.com",   phone:"+91 32109 87654", city:"Agra",    orders:5,  spend:3200,  status:"Blocked",  tier:"Silver",   joined:"Feb 2024", lastOrder:"15 Apr 2026", avatar:"R" },
];

const CATEGORY_PERF = [
  { name:"Puja Samagri", rev:182000, orders:420, pct:38, color:C.saffron  },
  { name:"Ghee & Oils",  rev:124000, orders:310, pct:26, color:C.marigold },
  { name:"Hawan",        rev:89000,  orders:198, pct:18, color:C.gold     },
  { name:"Idols",        rev:52000,  orders:112, pct:11, color:C.blue     },
  { name:"Sugandhit",    rev:35000,  orders:88,  pct:7,  color:C.purple   },
];

const TOP_PRODUCTS = [
  { name:"Pure Cow Ghee 500ml",  sold:1240, rev:370760, icon:"🫙", trend:+15 },
  { name:"Hawan Samagri Kit",    sold:892,  rev:445108, icon:"🪔", trend:+22 },
  { name:"Mangaldeep Agarbatti", sold:744,  rev:63240,  icon:"🕯️", trend:+8  },
  { name:"Navratri Puja Kit",    sold:412,  rev:329588, icon:"🪷", trend:+31 },
  { name:"Tulsi Mala 108 Beads", sold:389,  rev:57961,  icon:"📿", trend:-4  },
];

const ALERTS = [
  { type:"danger",  msg:"Cow Ghee 500ml — stock below 10 units",   time:"2 min ago" },
  { type:"warning", msg:"Order #ORD-1847 pending > 48 hours",       time:"1 hr ago"  },
  { type:"danger",  msg:"3 payment failures in last 30 minutes",    time:"32 min ago"},
  { type:"info",    msg:"Navratri campaign starts in 3 days",       time:"Today"     },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  Pending:   { color:C.marigold, bg:C.marigoldBg },
  Confirmed: { color:C.blue,     bg:C.blueBg     },
  Packed:    { color:C.purple,   bg:C.purpleBg   },
  Shipped:   { color:C.saffron,  bg:C.saffronBg  },
  Delivered: { color:C.green,    bg:C.greenBg    },
  Cancelled: { color:C.red,      bg:C.redBg      },
  Active:    { color:C.green,    bg:C.greenBg    },
  Inactive:  { color:C.textMid,  bg:C.bgElevated },
  Blocked:   { color:C.red,      bg:C.redBg      },
};
const TIER_CFG = {
  New:      { color:C.textMid,  bg:C.bgElevated },
  Silver:   { color:"#94A3B8",  bg:"#0F1520"    },
  Gold:     { color:C.gold,     bg:C.goldBg     },
  Platinum: { color:C.purple,   bg:C.purpleBg   },
};

function SBadge({ label, cfg }) {
  const s = cfg[label] || { color:C.textMid, bg:C.bgElevated };
  return <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:s.bg, color:s.color, fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:999 }}><span style={{ width:5, height:5, borderRadius:"50%", background:s.color }}/>{label}</span>;
}

function Card({ children, style={} }) {
  return <div style={{ background:C.bgCard, borderRadius:14, border:`1px solid ${C.border}`, ...style }}>{children}</div>;
}

function SectionTitle({ title, sub, action }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
      <div>
        <h2 style={{ fontFamily:"'Georgia',serif", fontSize:20, color:C.text, margin:"0 0 3px" }}>{title}</h2>
        {sub && <p style={{ fontSize:12, color:C.textLight, margin:0 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function TH({ children }) {
  return <th style={{ padding:"10px 14px", fontSize:10, fontWeight:700, color:C.textLight, textAlign:"left", textTransform:"uppercase", letterSpacing:0.8, borderBottom:`1px solid ${C.border}`, whiteSpace:"nowrap" }}>{children}</th>;
}
function TD({ children, bold, color }) {
  return <td style={{ padding:"12px 14px", fontSize:13, color:color||C.text, fontWeight:bold?700:400, whiteSpace:"nowrap", borderBottom:`1px solid ${C.border}` }}>{children}</td>;
}

// ─── OVERVIEW ─────────────────────────────────────────────────────────────────
function OverviewView() {
  const maxRev = Math.max(...REVENUE_CHART.map(r=>r.rev));
  const totalOrders = ORDER_STATUS_DIST.reduce((s,o)=>s+o.count,0);

  return (
    <div>
      {/* KPI grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12, marginBottom:24 }}>
        {OVERVIEW_STATS.map(s=>(
          <Card key={s.label} style={{ padding:"16px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:-8, right:-8, fontSize:40, opacity:0.06 }}>{s.icon}</div>
            <div style={{ fontSize:20, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontSize:22, fontWeight:700, color:s.color, marginBottom:3 }}>{s.value}</div>
            <div style={{ fontSize:10, color:C.textLight, marginBottom:4, textTransform:"uppercase", letterSpacing:0.6 }}>{s.label}</div>
            <div style={{ fontSize:11, color:s.trend>0?C.green:C.red, fontWeight:600 }}>{s.trend>0?"↑":"↓"} {Math.abs(s.trend)}% {s.sub}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:20, marginBottom:20 }}>
        {/* Revenue bar chart */}
        <Card style={{ padding:"24px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <div>
              <div style={{ fontFamily:"'Georgia',serif", fontSize:17, color:C.text, marginBottom:2 }}>Revenue Trend</div>
              <div style={{ fontSize:12, color:C.textLight }}>Jan – Jun 2026 · Monthly</div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              {["Revenue","Orders"].map((l,i)=><span key={l} style={{ fontSize:11, color:i===0?C.saffron:C.blue, display:"flex", alignItems:"center", gap:4 }}><span style={{ width:8, height:8, borderRadius:2, background:i===0?C.saffron:C.blue, display:"inline-block" }}/>{l}</span>)}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:160, marginBottom:12 }}>
            {REVENUE_CHART.map((r,i)=>{
              const isCur=i===REVENUE_CHART.length-1;
              const pct=r.rev/maxRev;
              return (
                <div key={r.month} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                  <div style={{ fontSize:9, color:isCur?C.saffron:C.textLight }}>{(r.rev/100000).toFixed(1)}L</div>
                  <div style={{ width:"100%", display:"flex", gap:2, alignItems:"flex-end", height:130 }}>
                    <div style={{ flex:1, borderRadius:"4px 4px 0 0", background:isCur?C.saffron:`${C.saffron}33`, height:`${pct*130}px`, minHeight:4, transition:"height 0.4s" }}/>
                    <div style={{ flex:1, borderRadius:"4px 4px 0 0", background:isCur?C.blue:`${C.blue}33`, height:`${(r.orders/780)*130}px`, minHeight:4, transition:"height 0.4s" }}/>
                  </div>
                  <div style={{ fontSize:10, color:isCur?C.saffron:C.textLight, fontWeight:isCur?700:400 }}>{r.month}</div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Order status donut */}
        <Card style={{ padding:"24px" }}>
          <div style={{ fontFamily:"'Georgia',serif", fontSize:17, color:C.text, marginBottom:20 }}>Order Status</div>
          {/* Simple horizontal bars as donut substitute */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {ORDER_STATUS_DIST.map(s=>(
              <div key={s.label}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:12 }}>
                  <span style={{ color:C.textMid }}>{s.label}</span>
                  <span style={{ color:s.color, fontWeight:700 }}>{s.count}</span>
                </div>
                <div style={{ height:6, background:C.bgElevated, borderRadius:3, overflow:"hidden" }}>
                  <div style={{ width:`${(s.count/totalOrders)*100}%`, height:"100%", background:s.color, borderRadius:3, transition:"width 0.5s" }}/>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:16, paddingTop:14, borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", fontSize:12 }}>
            <span style={{ color:C.textLight }}>Total</span>
            <span style={{ fontWeight:700, color:C.text }}>{totalOrders.toLocaleString()} orders</span>
          </div>
        </Card>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        {/* Top products */}
        <Card style={{ padding:"22px" }}>
          <div style={{ fontFamily:"'Georgia',serif", fontSize:17, color:C.text, marginBottom:16 }}>Top Selling Products</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {TOP_PRODUCTS.map((p,i)=>(
              <div key={p.name} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", background:C.bgElevated, borderRadius:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.textLight, width:16, textAlign:"center" }}>#{i+1}</div>
                <span style={{ fontSize:22 }}>{p.icon}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
                  <div style={{ fontSize:11, color:C.textLight }}>{p.sold.toLocaleString()} sold · ₹{(p.rev/100000).toFixed(1)}L revenue</div>
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:p.trend>0?C.green:C.red, flexShrink:0 }}>{p.trend>0?"↑":"↓"}{Math.abs(p.trend)}%</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Category performance */}
        <Card style={{ padding:"22px" }}>
          <div style={{ fontFamily:"'Georgia',serif", fontSize:17, color:C.text, marginBottom:16 }}>Category Performance</div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {CATEGORY_PERF.map(c=>(
              <div key={c.name}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:12 }}>
                  <span style={{ color:C.textMid, fontWeight:500 }}>{c.name}</span>
                  <div style={{ display:"flex", gap:12 }}>
                    <span style={{ color:C.textLight }}>{c.orders} orders</span>
                    <span style={{ color:c.color, fontWeight:700 }}>₹{(c.rev/1000).toFixed(0)}K</span>
                  </div>
                </div>
                <div style={{ height:8, background:C.bgElevated, borderRadius:4, overflow:"hidden" }}>
                  <div style={{ width:`${c.pct}%`, height:"100%", background:c.color, borderRadius:4, transition:"width 0.5s" }}/>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Alerts panel */}
      <Card style={{ padding:"20px" }}>
        <div style={{ fontFamily:"'Georgia',serif", fontSize:17, color:C.text, marginBottom:14 }}>🔔 System Alerts</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
          {ALERTS.map((a,i)=>(
            <div key={i} style={{ display:"flex", gap:12, padding:"12px 14px", background:a.type==="danger"?C.redBg:a.type==="warning"?C.marigoldBg:C.blueBg, borderRadius:10, border:`1px solid ${a.type==="danger"?C.red+"22":a.type==="warning"?C.marigold+"22":C.blue+"22"}`, alignItems:"flex-start" }}>
              <span style={{ fontSize:18, flexShrink:0 }}>{a.type==="danger"?"🔴":a.type==="warning"?"🟡":"🔵"}</span>
              <div>
                <div style={{ fontSize:13, color:C.text, fontWeight:500 }}>{a.msg}</div>
                <div style={{ fontSize:11, color:C.textLight, marginTop:3 }}>{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────
function OrdersView() {
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("All");
  const [selected, setSelected] = useState(null);
  const [page,     setPage]     = useState(1);
  const PER_PAGE = 6;

  const statuses = ["All","Pending","Confirmed","Packed","Shipped","Delivered","Cancelled"];
  const filtered = RECENT_ORDERS.filter(o=>{
    if(filter!=="All" && o.status!==filter) return false;
    if(search && !o.customer.toLowerCase().includes(search.toLowerCase()) && !o.id.includes(search)) return false;
    return true;
  });
  const paginated = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const totalPages = Math.ceil(filtered.length/PER_PAGE);

  return (
    <div>
      <SectionTitle title="Order Management" sub={`${filtered.length} orders found`}
        action={
          <div style={{ display:"flex", gap:8 }}>
            <button style={{ padding:"8px 14px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.textMid, fontSize:12, fontWeight:600, cursor:"pointer" }}>📥 Export CSV</button>
            <button style={{ padding:"8px 14px", borderRadius:8, border:"none", background:C.saffron, color:C.white, fontSize:12, fontWeight:700, cursor:"pointer" }}>+ New Order</button>
          </div>
        }
      />

      {/* Search + filters */}
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search order ID or customer…"
          style={{ flex:1, minWidth:200, padding:"9px 14px", borderRadius:9, border:`1px solid ${C.border}`, fontSize:13, color:C.text, background:C.bgElevated, outline:"none" }}/>
        <select style={{ padding:"9px 14px", borderRadius:9, border:`1px solid ${C.border}`, fontSize:13, color:C.text, background:C.bgElevated, outline:"none", cursor:"pointer" }}>
          <option>All Payment Methods</option>
          <option>UPI</option><option>Razorpay</option><option>COD</option><option>Card</option>
        </select>
        <input type="date" style={{ padding:"9px 14px", borderRadius:9, border:`1px solid ${C.border}`, fontSize:13, color:C.text, background:C.bgElevated, outline:"none", colorScheme:"dark" }}/>
      </div>

      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
        {statuses.map(s=>(
          <button key={s} onClick={()=>{setFilter(s);setPage(1);}} style={{ padding:"6px 14px", borderRadius:999, border:`1.5px solid ${filter===s?(STATUS_CFG[s]||{color:C.saffron}).color:C.border}`, background:filter===s?`${(STATUS_CFG[s]||{bg:C.saffronBg}).bg}`:"transparent", color:filter===s?(STATUS_CFG[s]||{color:C.saffron}).color:C.textMid, fontWeight:600, fontSize:11, cursor:"pointer", transition:"all 0.15s" }}>{s}</button>
        ))}
      </div>

      {/* Table */}
      <Card style={{ overflow:"hidden", marginBottom:16 }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead style={{ background:C.bgElevated }}>
              <tr>
                <TH>Order ID</TH><TH>Customer</TH><TH>City</TH><TH>Items</TH>
                <TH>Amount</TH><TH>Payment</TH><TH>Status</TH><TH>Time</TH><TH>Actions</TH>
              </tr>
            </thead>
            <tbody>
              {paginated.map(o=>(
                <tr key={o.id} onClick={()=>setSelected(selected?.id===o.id?null:o)}
                  style={{ cursor:"pointer", background:selected?.id===o.id?C.saffronBg:"transparent", transition:"background 0.15s" }}
                  onMouseEnter={e=>{ if(selected?.id!==o.id) e.currentTarget.style.background=C.bgHover; }}
                  onMouseLeave={e=>{ if(selected?.id!==o.id) e.currentTarget.style.background="transparent"; }}>
                  <TD><span style={{ color:C.saffron, fontWeight:700, fontSize:12 }}>{o.id}</span></TD>
                  <TD><div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ width:28, height:28, borderRadius:"50%", background:C.saffronBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:C.saffron, flexShrink:0 }}>{o.customer[0]}</div>{o.customer}</div></TD>
                  <TD color={C.textMid}>{o.city}</TD>
                  <TD><span style={{ fontSize:16, marginRight:4 }}>{o.icon}</span>{o.items}</TD>
                  <TD bold>₹{o.amount.toLocaleString()}</TD>
                  <TD color={C.textMid}>{o.payment}</TD>
                  <TD><SBadge label={o.status} cfg={STATUS_CFG}/></TD>
                  <TD color={C.textLight}>{o.time}</TD>
                  <TD>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={e=>e.stopPropagation()} style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${C.border}`, background:"transparent", color:C.textMid, fontSize:11, fontWeight:600, cursor:"pointer" }}>View</button>
                      <button onClick={e=>e.stopPropagation()} style={{ padding:"4px 10px", borderRadius:6, border:"none", background:C.saffronBg, color:C.saffron, fontSize:11, fontWeight:600, cursor:"pointer" }}>Invoice</button>
                    </div>
                  </TD>
                </tr>
              ))}
              {paginated.length===0 && (
                <tr><td colSpan={9} style={{ textAlign:"center", padding:"40px 0", color:C.textLight, fontSize:14 }}>No orders match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display:"flex", justifyContent:"center", gap:8 }}>
          {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
            <button key={p} onClick={()=>setPage(p)} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${page===p?C.saffron:C.border}`, background:page===p?C.saffron:"transparent", color:page===p?C.white:C.textMid, fontWeight:600, fontSize:12, cursor:"pointer" }}>{p}</button>
          ))}
        </div>
      )}

      {/* Order detail drawer */}
      {selected && (
        <Card style={{ padding:"22px", marginTop:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{ fontFamily:"'Georgia',serif", fontSize:17, color:C.text }}>Order Detail — {selected.id}</div>
            <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", color:C.textLight, fontSize:18, cursor:"pointer" }}>✕</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
            {[["Customer",selected.customer],["City",selected.city],["Amount",`₹${selected.amount}`],["Payment",selected.payment],["Status",selected.status],["Items",selected.items],["Time",selected.time],["Courier","Shiprocket"]].map(([k,v])=>(
              <div key={k} style={{ background:C.bgElevated, borderRadius:9, padding:"10px 12px" }}>
                <div style={{ fontSize:10, color:C.textLight, fontWeight:700, textTransform:"uppercase", letterSpacing:0.6, marginBottom:4 }}>{k}</div>
                <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {["✅ Mark Delivered","📦 Update Status","🖨️ Print Invoice","🚚 Track Shipment","↩️ Process Return"].map(action=>(
              <button key={action} style={{ padding:"8px 14px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.textMid, fontSize:12, fontWeight:600, cursor:"pointer" }}>{action}</button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── USERS ────────────────────────────────────────────────────────────────────
function UsersView() {
  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState(null);
  const [tierFilter, setTierFilter] = useState("All");

  const tiers = ["All","New","Silver","Gold","Platinum","Blocked"];
  const filtered = USERS.filter(u=>{
    if(tierFilter!=="All" && (u.tier!==tierFilter && u.status!==tierFilter)) return false;
    if(search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.includes(search)) return false;
    return true;
  });

  const userStats = [
    { label:"Total Customers",  value:USERS.length,                          color:C.blue    },
    { label:"Active",           value:USERS.filter(u=>u.status==="Active").length, color:C.green },
    { label:"New This Month",   value:2,                                      color:C.saffron },
    { label:"Blocked",          value:USERS.filter(u=>u.status==="Blocked").length, color:C.red },
  ];

  return (
    <div>
      <SectionTitle title="User Management" sub={`${filtered.length} customers`}
        action={<button style={{ padding:"8px 14px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.textMid, fontSize:12, fontWeight:600, cursor:"pointer" }}>📥 Export Users</button>}
      />

      {/* Mini stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {userStats.map(s=>(
          <Card key={s.label} style={{ padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:22, fontWeight:700, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:11, color:C.textLight }}>{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search name or email…"
          style={{ flex:1, minWidth:200, padding:"9px 14px", borderRadius:9, border:`1px solid ${C.border}`, fontSize:13, color:C.text, background:C.bgElevated, outline:"none" }}/>
        <div style={{ display:"flex", gap:6 }}>
          {tiers.map(t=>(
            <button key={t} onClick={()=>setTierFilter(t)} style={{ padding:"6px 14px", borderRadius:999, border:`1.5px solid ${tierFilter===t?C.saffron:C.border}`, background:tierFilter===t?C.saffronBg:"transparent", color:tierFilter===t?C.saffron:C.textMid, fontWeight:600, fontSize:11, cursor:"pointer", transition:"all 0.15s" }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:selected?"1fr 340px":"1fr", gap:20 }}>
        {/* Table */}
        <Card style={{ overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead style={{ background:C.bgElevated }}>
              <tr>
                <TH>Customer</TH><TH>Contact</TH><TH>City</TH>
                <TH>Orders</TH><TH>Total Spend</TH><TH>Tier</TH>
                <TH>Status</TH><TH>Last Order</TH><TH>Actions</TH>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u=>(
                <tr key={u.id} onClick={()=>setSelected(selected?.id===u.id?null:u)}
                  style={{ cursor:"pointer", background:selected?.id===u.id?C.saffronBg:"transparent", transition:"background 0.15s" }}
                  onMouseEnter={e=>{ if(selected?.id!==u.id) e.currentTarget.style.background=C.bgHover; }}
                  onMouseLeave={e=>{ if(selected?.id!==u.id) e.currentTarget.style.background="transparent"; }}>
                  <TD>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:30, height:30, borderRadius:"50%", background:C.saffronBg, border:`1.5px solid ${C.saffron}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:C.saffron, flexShrink:0 }}>{u.avatar}</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{u.name}</div>
                        <div style={{ fontSize:10, color:C.textLight }}>{u.id}</div>
                      </div>
                    </div>
                  </TD>
                  <TD color={C.textMid}><div style={{ fontSize:12 }}>{u.email}</div><div style={{ fontSize:11, color:C.textLight }}>{u.phone}</div></TD>
                  <TD color={C.textMid}>{u.city}</TD>
                  <TD bold>{u.orders}</TD>
                  <TD bold color={C.text}>₹{u.spend.toLocaleString()}</TD>
                  <TD><SBadge label={u.tier} cfg={TIER_CFG}/></TD>
                  <TD><SBadge label={u.status} cfg={STATUS_CFG}/></TD>
                  <TD color={C.textLight} style={{ fontSize:11 }}>{u.lastOrder}</TD>
                  <TD>
                    <div style={{ display:"flex", gap:5 }}>
                      <button onClick={e=>e.stopPropagation()} style={{ padding:"4px 8px", borderRadius:6, border:`1px solid ${C.border}`, background:"transparent", color:C.textMid, fontSize:10, fontWeight:600, cursor:"pointer" }}>View</button>
                      {u.status==="Active" && <button onClick={e=>e.stopPropagation()} style={{ padding:"4px 8px", borderRadius:6, border:`1px solid ${C.red}22`, background:C.redBg, color:C.red, fontSize:10, fontWeight:600, cursor:"pointer" }}>Block</button>}
                      {u.status==="Blocked" && <button onClick={e=>e.stopPropagation()} style={{ padding:"4px 8px", borderRadius:6, border:`1px solid ${C.green}22`, background:C.greenBg, color:C.green, fontSize:10, fontWeight:600, cursor:"pointer" }}>Unblock</button>}
                    </div>
                  </TD>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* User detail */}
        {selected && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <Card style={{ padding:"20px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                <div style={{ fontFamily:"'Georgia',serif", fontSize:16, color:C.text }}>Customer Profile</div>
                <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", color:C.textLight, fontSize:16, cursor:"pointer" }}>✕</button>
              </div>
              <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:16 }}>
                <div style={{ width:48, height:48, borderRadius:"50%", background:C.saffronBg, border:`2px solid ${C.saffron}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, color:C.saffron }}>{selected.avatar}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:15, color:C.text }}>{selected.name}</div>
                  <div style={{ fontSize:12, color:C.textLight }}>{selected.city} · Joined {selected.joined}</div>
                </div>
              </div>
              {[["Email",selected.email],["Phone",selected.phone],["Orders",selected.orders],["Total Spend",`₹${selected.spend.toLocaleString()}`],["Tier",selected.tier],["Last Order",selected.lastOrder]].map(([k,v])=>(
                <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:9, fontSize:12 }}>
                  <span style={{ color:C.textLight }}>{k}</span>
                  <span style={{ fontWeight:600, color:C.text }}>{v}</span>
                </div>
              ))}
            </Card>
            <Card style={{ padding:"16px" }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:10 }}>Admin Actions</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {["📦 View Orders","💬 Send Message","🎁 Add Reward Points","📊 View Analytics",selected.status==="Active"?"🚫 Block Account":"✅ Unblock Account"].map(a=>(
                  <button key={a} style={{ padding:"9px 14px", borderRadius:9, border:`1px solid ${C.border}`, background:"transparent", color:a.includes("Block")&&selected.status==="Active"?C.red:C.textMid, fontWeight:600, fontSize:12, cursor:"pointer", textAlign:"left" }}>{a}</button>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
function ReportsView() {
  const [range, setRange] = useState("This Month");
  const ranges = ["Today","This Week","This Month","This Year"];

  const reportCards = [
    { title:"Sales Report",      icon:"📈", desc:"Revenue, orders, AOV, growth trends",        color:C.saffron  },
    { title:"Inventory Report",  icon:"📦", desc:"Stock levels, low stock, valuation",          color:C.blue     },
    { title:"Customer Report",   icon:"👥", desc:"New, repeat, LTV, segmentation",              color:C.green    },
    { title:"GST Report",        icon:"🧾", desc:"CGST, SGST, IGST, HSN summary",              color:C.gold     },
    { title:"Festival Report",   icon:"🪔", desc:"Navratri, Diwali, Janmashtami performance",   color:C.marigold },
    { title:"Courier Report",    icon:"🚚", desc:"Delivery success, NDR, partner performance",  color:C.purple   },
    { title:"Payment Report",    icon:"💳", desc:"UPI, COD, card split, failed payments",       color:C.red      },
    { title:"Coupon Report",     icon:"🏷️", desc:"Usage, discount given, conversion rates",     color:C.blue     },
  ];

  const kpis = [
    { label:"Gross Revenue",    value:"₹4.82L",  sub:"Jun 2026",    color:C.saffron  },
    { label:"Net Revenue",      value:"₹4.51L",  sub:"After refunds",color:C.green   },
    { label:"Profit Margin",    value:"38.2%",   sub:"Avg this month",color:C.gold   },
    { label:"Return Rate",      value:"2.1%",    sub:"Below target",  color:C.blue   },
    { label:"Cart Abandonment", value:"34.8%",   sub:"↓ 3% vs May",  color:C.marigold},
    { label:"Repeat Rate",      value:"42.3%",   sub:"Target: 45%",  color:C.purple  },
  ];

  const gstData = [
    { month:"Apr", cgst:24000, sgst:24000, igst:18000 },
    { month:"May", cgst:21000, sgst:21000, igst:14000 },
    { month:"Jun", cgst:28000, sgst:28000, igst:19000 },
  ];

  return (
    <div>
      <SectionTitle title="Reports & Analytics" sub="Business intelligence across all modules"
        action={
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <div style={{ display:"flex", background:C.bgElevated, borderRadius:9, padding:3, gap:2 }}>
              {ranges.map(r=>(
                <button key={r} onClick={()=>setRange(r)} style={{ padding:"6px 12px", borderRadius:7, border:"none", background:range===r?C.saffron:"transparent", color:range===r?C.white:C.textMid, fontWeight:600, fontSize:11, cursor:"pointer", transition:"all 0.15s" }}>{r}</button>
              ))}
            </div>
            <button style={{ padding:"8px 14px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.textMid, fontSize:12, fontWeight:600, cursor:"pointer" }}>📅 Custom Range</button>
          </div>
        }
      />

      {/* KPI summary row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12, marginBottom:24 }}>
        {kpis.map(k=>(
          <Card key={k.label} style={{ padding:"14px" }}>
            <div style={{ fontSize:18, fontWeight:700, color:k.color, marginBottom:3 }}>{k.value}</div>
            <div style={{ fontSize:10, color:C.textLight, fontWeight:700, textTransform:"uppercase", letterSpacing:0.6, marginBottom:3 }}>{k.label}</div>
            <div style={{ fontSize:10, color:C.textLight }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      {/* Report cards grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        {reportCards.map(r=>(
          <div key={r.title} style={{ background:C.bgCard, borderRadius:14, border:`1px solid ${C.border}`, padding:"20px", cursor:"pointer", transition:"all 0.2s" }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=r.color; e.currentTarget.style.background=C.bgElevated; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background=C.bgCard; }}>
            <div style={{ fontSize:28, marginBottom:10 }}>{r.icon}</div>
            <div style={{ fontWeight:700, fontSize:14, color:C.text, marginBottom:6 }}>{r.title}</div>
            <div style={{ fontSize:12, color:C.textLight, lineHeight:1.5, marginBottom:14 }}>{r.desc}</div>
            <div style={{ display:"flex", gap:6 }}>
              <button style={{ padding:"6px 12px", borderRadius:7, border:"none", background:r.color, color:C.white, fontWeight:700, fontSize:11, cursor:"pointer" }}>Generate</button>
              <button style={{ padding:"6px 10px", borderRadius:7, border:`1px solid ${C.border}`, background:"transparent", color:C.textMid, fontWeight:600, fontSize:11, cursor:"pointer" }}>Schedule</button>
            </div>
          </div>
        ))}
      </div>

      {/* GST summary + payment split */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        {/* GST table */}
        <Card style={{ padding:"22px" }}>
          <div style={{ fontFamily:"'Georgia',serif", fontSize:17, color:C.text, marginBottom:16 }}>GST Summary — Q2 2026</div>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:C.bgElevated }}>
                <TH>Month</TH><TH>CGST</TH><TH>SGST</TH><TH>IGST</TH><TH>Total</TH>
              </tr>
            </thead>
            <tbody>
              {gstData.map(g=>(
                <tr key={g.month}>
                  <TD bold>{g.month}</TD>
                  <TD color={C.saffron}>₹{g.cgst.toLocaleString()}</TD>
                  <TD color={C.blue}>₹{g.sgst.toLocaleString()}</TD>
                  <TD color={C.green}>₹{g.igst.toLocaleString()}</TD>
                  <TD bold>₹{(g.cgst+g.sgst+g.igst).toLocaleString()}</TD>
                </tr>
              ))}
              <tr style={{ background:C.bgElevated }}>
                <td style={{ padding:"10px 14px", fontSize:12, fontWeight:700, color:C.text }}>Total</td>
                <td style={{ padding:"10px 14px", fontSize:12, fontWeight:700, color:C.saffron }}>₹{gstData.reduce((s,g)=>s+g.cgst,0).toLocaleString()}</td>
                <td style={{ padding:"10px 14px", fontSize:12, fontWeight:700, color:C.blue }}>₹{gstData.reduce((s,g)=>s+g.sgst,0).toLocaleString()}</td>
                <td style={{ padding:"10px 14px", fontSize:12, fontWeight:700, color:C.green }}>₹{gstData.reduce((s,g)=>s+g.igst,0).toLocaleString()}</td>
                <td style={{ padding:"10px 14px", fontSize:12, fontWeight:700, color:C.gold }}>₹{gstData.reduce((s,g)=>s+g.cgst+g.sgst+g.igst,0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop:14, display:"flex", gap:8 }}>
            <button style={{ padding:"8px 14px", borderRadius:8, border:"none", background:C.saffron, color:C.white, fontWeight:700, fontSize:12, cursor:"pointer" }}>📥 Export GST Report</button>
            <button style={{ padding:"8px 14px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.textMid, fontWeight:600, fontSize:12, cursor:"pointer" }}>📧 Email to CA</button>
          </div>
        </Card>

        {/* Payment split */}
        <Card style={{ padding:"22px" }}>
          <div style={{ fontFamily:"'Georgia',serif", fontSize:17, color:C.text, marginBottom:16 }}>Payment Method Split — {range}</div>
          {[
            { method:"UPI",        pct:48, amt:"₹2.31L", color:C.green   },
            { method:"Razorpay",   pct:22, amt:"₹1.06L", color:C.blue    },
            { method:"COD",        pct:18, amt:"₹0.87L", color:C.marigold},
            { method:"Credit Card",pct:8,  amt:"₹0.39L", color:C.purple  },
            { method:"Debit Card", pct:4,  amt:"₹0.19L", color:C.saffron },
          ].map(p=>(
            <div key={p.method} style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, fontSize:12 }}>
                <span style={{ color:C.textMid }}>{p.method}</span>
                <div style={{ display:"flex", gap:12 }}>
                  <span style={{ color:C.textLight }}>{p.pct}%</span>
                  <span style={{ color:p.color, fontWeight:700 }}>{p.amt}</span>
                </div>
              </div>
              <div style={{ height:8, background:C.bgElevated, borderRadius:4, overflow:"hidden" }}>
                <div style={{ width:`${p.pct}%`, height:"100%", background:p.color, borderRadius:4 }}/>
              </div>
            </div>
          ))}
          <div style={{ marginTop:14, padding:"12px 14px", background:C.bgElevated, borderRadius:10, display:"flex", justifyContent:"space-between", fontSize:13 }}>
            <span style={{ color:C.textLight }}>Failed Payments</span>
            <span style={{ color:C.red, fontWeight:700 }}>12 · ₹8,420</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── NAV + ROOT ───────────────────────────────────────────────────────────────
const NAV = [
  { id:"overview", label:"Overview",  icon:"📊" },
  { id:"orders",   label:"Orders",    icon:"📦" },
  { id:"users",    label:"Users",     icon:"👥" },
  { id:"reports",  label:"Reports",   icon:"📈" },
];

const SIDEBAR_NAV = [
  { group:"Core", items:[
    { id:"overview",  label:"Overview",     icon:"📊" },
    { id:"orders",    label:"Orders",       icon:"📦" },
    { id:"users",     label:"Users",        icon:"👥" },
    { id:"reports",   label:"Reports",      icon:"📈" },
  ]},
  { group:"Management", items:[
    { id:"products",  label:"Products",     icon:"🏷️", disabled:true },
    { id:"inventory", label:"Inventory",    icon:"🏭", disabled:true },
    { id:"coupons",   label:"Coupons",      icon:"🎟️", disabled:true },
  ]},
  { group:"System", items:[
    { id:"settings",  label:"Settings",     icon:"⚙️", disabled:true },
    { id:"logs",      label:"Audit Logs",   icon:"📋", disabled:true },
  ]},
];

export default function AdminDashboard() {
  const [view, setView] = useState("overview");
  const router = useRouter();
  const logOut = () => { clearAdminSession(); router.push("/login"); };

  return (
    <RequireAuth>
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Segoe UI','Helvetica Neue',sans-serif", color:C.text, display:"flex" }}>

      {/* Sidebar */}
      <div style={{ width:220, flexShrink:0, background:C.bgCard, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh", overflowY:"auto" }}>
        {/* Logo */}
        <div style={{ padding:"20px 18px", borderBottom:`1px solid ${C.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:20 }}>🪔</span>
            <div>
              <div style={{ fontFamily:"'Georgia',serif", fontWeight:700, fontSize:14, color:C.saffron }}>nityasamagri</div>
              <div style={{ fontSize:10, color:C.textLight, letterSpacing:1 }}>ADMIN PANEL</div>
            </div>
          </div>
        </div>

        {/* Nav groups */}
        <div style={{ flex:1, padding:"12px 10px" }}>
          {SIDEBAR_NAV.map(group=>(
            <div key={group.group} style={{ marginBottom:20 }}>
              <div style={{ fontSize:9, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:1.2, padding:"0 8px", marginBottom:6 }}>{group.group}</div>
              {group.items.map(item=>(
                <button key={item.id} onClick={()=>!item.disabled&&setView(item.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 10px", borderRadius:9, border:"none", background:view===item.id?C.saffronBg:"transparent", color:view===item.id?C.saffron:item.disabled?C.textLight:C.textMid, fontWeight:view===item.id?700:400, fontSize:13, cursor:item.disabled?"not-allowed":"pointer", marginBottom:2, transition:"all 0.15s", opacity:item.disabled?0.4:1, borderLeft:`3px solid ${view===item.id?C.saffron:"transparent"}`, textAlign:"left" }}>
                  <span style={{ fontSize:15 }}>{item.icon}</span>
                  {item.label}
                  {item.disabled&&<span style={{ marginLeft:"auto", fontSize:9, color:C.textLight }}>soon</span>}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Admin profile */}
        <div style={{ padding:"14px 16px", borderTop:`1px solid ${C.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:C.saffronBg, border:`2px solid ${C.saffron}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:C.saffron }}>SA</div>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:C.text }}>Super Admin</div>
              <div style={{ fontSize:10, color:C.textLight }}>admin@nityasamagri.com</div>
            </div>
          </div>
          <button onClick={logOut} style={{ width:"100%", padding:"8px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.textMid, fontWeight:600, fontSize:11, cursor:"pointer" }}>
            ⏻ Log Out
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, overflow:"auto" }}>
        {/* Top bar */}
        <div style={{ background:C.bgCard, borderBottom:`1px solid ${C.border}`, padding:"0 24px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:40 }}>
          <div>
            <span style={{ fontFamily:"'Georgia',serif", fontSize:16, color:C.text, fontWeight:700 }}>
              {NAV.find(n=>n.id===view)?.icon} {NAV.find(n=>n.id===view)?.label || view.charAt(0).toUpperCase()+view.slice(1)}
            </span>
            <span style={{ fontSize:11, color:C.textLight, marginLeft:10 }}>Sun, 31 May 2026</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, background:C.greenBg, borderRadius:999, padding:"5px 12px", fontSize:11, color:C.green, fontWeight:600 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:C.green, display:"inline-block" }}/>
              All Systems Live
            </div>
            <div style={{ position:"relative" }}>
              <span style={{ fontSize:20, cursor:"pointer" }}>🔔</span>
              <div style={{ position:"absolute", top:-4, right:-4, width:16, height:16, borderRadius:"50%", background:C.red, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:C.white }}>4</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding:"28px 24px" }}>
          {view==="overview" && <OverviewView/>}
          {view==="orders"   && <OrdersView/>}
          {view==="users"    && <UsersView/>}
          {view==="reports"  && <ReportsView/>}
        </div>
      </div>
    </div>
    </RequireAuth>
  );
}