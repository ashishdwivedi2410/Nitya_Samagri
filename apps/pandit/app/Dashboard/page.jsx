import { useState } from "react";

// ─── THEME — Deep Vedic: dark saffron + ivory + gold on warm charcoal ─────────
const C = {
  bg:        "#1C1008",
  bgCard:    "#251508",
  bgLight:   "#2E1C0A",
  saffron:   "#E8560A",
  saffronSoft:"#F47B3A",
  saffronBg: "#2A1206",
  marigold:  "#F5A623",
  marigoldBg:"#261800",
  gold:      "#D4A017",
  goldBg:    "#231600",
  cream:     "#FFF3DC",
  creamDim:  "#C8A870",
  creamFaint:"#3A2510",
  text:      "#FFF3DC",
  textMid:   "#C8A870",
  textLight: "#8A6A40",
  white:     "#FFFFFF",
  green:     "#2ECC71",
  greenBg:   "#0D2B1A",
  red:       "#E74C3C",
  redBg:     "#2B0D0D",
  blue:      "#3498DB",
  blueBg:    "#0D1F2B",
  border:    "#3A2510",
  borderLight:"#4A3218",
};

const pandit = {
  name:     "Pt. Ramesh Sharma",
  avatar:   "🧘",
  exp:      "18 yrs",
  city:     "Delhi",
  rating:   4.9,
  reviews:  412,
  tier:     "Gold Pandit",
  verified: true,
  phone:    "+91 98765 43210",
  status:   "available",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = ["S","M","T","W","T","F","S"];
const FULL_DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const bookings = [
  { id:"#BK-0901", customer:"Priya Verma",   ceremony:"Satyanarayan Katha", date:"2 Jun 2026",  time:"08:00 AM", city:"Delhi",   amount:2500, status:"Confirmed",  avatar:"P", samagri:"Platform" },
  { id:"#BK-0902", customer:"Amit Gupta",    ceremony:"Griha Pravesh",      date:"5 Jun 2026",  time:"10:00 AM", city:"Noida",   amount:3500, status:"Pending",    avatar:"A", samagri:"Customer" },
  { id:"#BK-0903", customer:"Sunita Rao",    ceremony:"Rudrabhishek",       date:"8 Jun 2026",  time:"07:00 AM", city:"Gurgaon", amount:3500, status:"Confirmed",  avatar:"S", samagri:"Platform" },
  { id:"#BK-0904", customer:"Vikram Singh",  ceremony:"Navgrah Shanti",     date:"12 Jun 2026", time:"09:00 AM", city:"Delhi",   amount:4500, status:"Pending",    avatar:"V", samagri:"Pandit"   },
  { id:"#BK-0905", customer:"Neha Jain",     ceremony:"Mundan Sanskar",     date:"15 Jun 2026", time:"10:00 AM", city:"Delhi",   amount:2000, status:"Completed",  avatar:"N", samagri:"Platform" },
  { id:"#BK-0906", customer:"Rohit Mehta",   ceremony:"Vastu Puja",         date:"18 May 2026", time:"11:00 AM", city:"Faridabad",amount:2000,status:"Completed",  avatar:"R", samagri:"Customer" },
  { id:"#BK-0907", customer:"Kavita Sharma", ceremony:"Satyanarayan Katha", date:"10 May 2026", time:"08:00 AM", city:"Delhi",   amount:2500, status:"Cancelled",  avatar:"K", samagri:"Platform" },
];

const earningsData = {
  thisMonth: 18500,
  lastMonth: 14200,
  thisYear:  156000,
  pending:   6000,
  monthly: [
    { month:"Jan", amt:8400  },
    { month:"Feb", amt:11200 },
    { month:"Mar", amt:13500 },
    { month:"Apr", amt:10800 },
    { month:"May", amt:14200 },
    { month:"Jun", amt:18500 },
  ],
  payouts: [
    { id:"PO-001", date:"1 Jun 2026",  amount:14200, method:"Bank Transfer", status:"Completed" },
    { id:"PO-002", date:"1 May 2026",  amount:10800, method:"UPI",           status:"Completed" },
    { id:"PO-003", date:"1 Apr 2026",  amount:13500, method:"Bank Transfer", status:"Completed" },
  ],
};

const BLOCKED_DATES = [3,4,10,17,24]; // June 2026

const STATUS_CFG = {
  Confirmed:  { color:C.green,    bg:C.greenBg,    dot:C.green,    icon:"✓"  },
  Pending:    { color:C.marigold, bg:C.marigoldBg, dot:C.marigold, icon:"⏳" },
  Completed:  { color:C.gold,     bg:C.goldBg,     dot:C.gold,     icon:"🏅" },
  Cancelled:  { color:C.red,      bg:C.redBg,      dot:C.red,      icon:"✕"  },
};

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function Badge({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.Pending;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:s.bg, color:s.color, fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:999, letterSpacing:0.3 }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:s.dot }}/>
      {status}
    </span>
  );
}

function Card({ children, style={} }) {
  return <div style={{ background:C.bgCard, borderRadius:16, border:`1px solid ${C.border}`, ...style }}>{children}</div>;
}

function StatCard({ icon, label, value, sub, color=C.saffron, trend }) {
  return (
    <Card style={{ padding:"20px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-10, right:-10, fontSize:56, opacity:0.07 }}>{icon}</div>
      <div style={{ fontSize:24, marginBottom:8 }}>{icon}</div>
      <div style={{ fontSize:11, color:C.textLight, fontWeight:600, marginBottom:4, textTransform:"uppercase", letterSpacing:0.8 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:700, color, marginBottom:4 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:C.textLight }}>{sub}</div>}
      {trend && <div style={{ fontSize:11, color:trend>0?C.green:C.red, fontWeight:600, marginTop:4 }}>{trend>0?"↑":"↓"} {Math.abs(trend)}% vs last month</div>}
    </Card>
  );
}

function SectionTitle({ title, sub }) {
  return (
    <div style={{ marginBottom:20 }}>
      <h2 style={{ fontFamily:"'Georgia',serif", fontSize:20, color:C.text, margin:"0 0 4px" }}>{title}</h2>
      {sub && <p style={{ fontSize:13, color:C.textLight, margin:0 }}>{sub}</p>}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardView({ setView }) {
  const todayBk   = bookings.filter(b => b.status==="Confirmed").slice(0,2);
  const pendingBk = bookings.filter(b => b.status==="Pending");

  return (
    <div>
      {/* Hero welcome */}
      <div style={{ background:`linear-gradient(135deg, ${C.saffron} 0%, #A83D07 100%)`, borderRadius:20, padding:"28px 32px", marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", right:-20, top:-20, fontSize:120, opacity:0.08 }}>🪔</div>
        <div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.75)", marginBottom:6 }}>🙏 Jai Shri Ram · Good Morning</div>
          <div style={{ fontFamily:"'Georgia',serif", fontSize:26, color:C.white, fontWeight:700, marginBottom:4 }}>{pandit.name}</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)" }}>{pandit.exp} experience · {pandit.city} · ⭐ {pandit.rating} ({pandit.reviews} reviews)</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:10 }}>
          <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:12, padding:"12px 18px", textAlign:"center", backdropFilter:"blur(8px)" }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", marginBottom:2 }}>🏅 {pandit.tier}</div>
            <div style={{ fontSize:22, fontWeight:700, color:C.white }}>₹{earningsData.thisMonth.toLocaleString()}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)" }}>This month</div>
          </div>
          {/* availability toggle */}
          <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.10)", borderRadius:999, padding:"6px 14px" }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:C.green }}/>
            <span style={{ fontSize:12, color:C.white, fontWeight:600 }}>Available</span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        <StatCard icon="📅" label="Today's Bookings" value={todayBk.length}  sub="Upcoming today"          color={C.saffron}  trend={25} />
        <StatCard icon="⏳" label="Pending Requests" value={pendingBk.length} sub="Awaiting your response"  color={C.marigold} />
        <StatCard icon="✅" label="Completed Pujas"  value={bookings.filter(b=>b.status==="Completed").length} sub="All time"  color={C.gold} />
        <StatCard icon="⭐" label="Avg Rating"       value={`${pandit.rating}/5`} sub={`${pandit.reviews} reviews`} color={C.gold} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:20 }}>
        {/* Upcoming bookings */}
        <Card style={{ padding:"22px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
            <div style={{ fontFamily:"'Georgia',serif", fontSize:17, color:C.text }}>Upcoming Bookings</div>
            <button onClick={()=>setView("bookings")} style={{ background:"none", border:"none", color:C.saffron, fontWeight:600, fontSize:12, cursor:"pointer" }}>View all →</button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {bookings.filter(b=>b.status==="Confirmed"||b.status==="Pending").slice(0,4).map(b=>(
              <div key={b.id} style={{ display:"flex", gap:12, alignItems:"center", padding:"12px 14px", background:C.bgLight, borderRadius:12, border:`1px solid ${C.border}` }}>
                <div style={{ width:38, height:38, borderRadius:"50%", background:C.saffronBg, border:`1.5px solid ${C.saffron}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, color:C.saffron, flexShrink:0 }}>{b.avatar}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:C.text, marginBottom:2 }}>{b.ceremony}</div>
                  <div style={{ fontSize:11, color:C.textLight }}>{b.customer} · {b.date} · {b.time}</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <Badge status={b.status}/>
                  <div style={{ fontSize:13, fontWeight:700, color:C.saffron, marginTop:4 }}>₹{b.amount.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right column */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Pending actions */}
          {pendingBk.length > 0 && (
            <Card style={{ padding:"18px", border:`1px solid ${C.marigold}44` }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.marigold, marginBottom:12 }}>⚡ Action Required</div>
              {pendingBk.slice(0,2).map(b=>(
                <div key={b.id} style={{ marginBottom:12, paddingBottom:12, borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:4 }}>{b.ceremony}</div>
                  <div style={{ fontSize:11, color:C.textLight, marginBottom:8 }}>{b.customer} · {b.date}</div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button style={{ flex:1, padding:"7px", borderRadius:8, border:"none", background:C.green, color:C.white, fontWeight:700, fontSize:11, cursor:"pointer" }}>✓ Accept</button>
                    <button style={{ flex:1, padding:"7px", borderRadius:8, border:`1px solid ${C.red}`, background:"transparent", color:C.red, fontWeight:600, fontSize:11, cursor:"pointer" }}>✕ Decline</button>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* Quick stats */}
          <Card style={{ padding:"18px" }}>
            <div style={{ fontFamily:"'Georgia',serif", fontSize:15, color:C.text, marginBottom:14 }}>This Month</div>
            {[
              ["Bookings Completed", "4"],
              ["Acceptance Rate",    "96%"],
              ["Avg Puja Duration",  "2.8 hrs"],
              ["Repeat Customers",   "38%"],
            ].map(([k,v])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:10, fontSize:12 }}>
                <span style={{ color:C.textLight }}>{k}</span>
                <span style={{ fontWeight:700, color:C.text }}>{v}</span>
              </div>
            ))}
          </Card>

          {/* Earnings snapshot */}
          <Card style={{ padding:"18px", background:`linear-gradient(135deg, ${C.goldBg}, ${C.bgCard})` }}>
            <div style={{ fontSize:11, color:C.gold, fontWeight:700, marginBottom:4, textTransform:"uppercase", letterSpacing:0.8 }}>💰 Pending Payout</div>
            <div style={{ fontSize:28, fontWeight:700, color:C.gold }}>₹{earningsData.pending.toLocaleString()}</div>
            <div style={{ fontSize:11, color:C.textLight, marginBottom:12 }}>Next payout: 1 July 2026</div>
            <button onClick={()=>setView("earnings")} style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${C.gold}`, background:"transparent", color:C.gold, fontWeight:600, fontSize:11, cursor:"pointer" }}>View Earnings →</button>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────
function BookingsView() {
  const [filter, setFilter]   = useState("All");
  const [selected, setSelected] = useState(null);
  const filters = ["All","Confirmed","Pending","Completed","Cancelled"];

  const filtered = filter==="All" ? bookings : bookings.filter(b=>b.status===filter);

  return (
    <div>
      <SectionTitle title="My Bookings" sub={`${bookings.length} total bookings`}/>

      {/* Filter tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:20, flexWrap:"wrap" }}>
        {filters.map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{ padding:"7px 16px", borderRadius:999, border:`1.5px solid ${filter===f?C.saffron:C.border}`, background:filter===f?C.saffron:"transparent", color:filter===f?C.white:C.textMid, fontWeight:600, fontSize:12, cursor:"pointer", transition:"all 0.15s" }}>{f}</button>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns: selected ? "1fr 360px" : "1fr", gap:20 }}>
        {/* Booking list */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {filtered.map(b=>(
            <div key={b.id} onClick={()=>setSelected(selected?.id===b.id?null:b)}
              style={{ background:C.bgCard, borderRadius:14, border:`2px solid ${selected?.id===b.id?C.saffron:C.border}`, padding:"16px 18px", cursor:"pointer", transition:"all 0.15s", boxShadow:selected?.id===b.id?`0 0 0 3px ${C.saffron}18`:"none" }}>
              <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
                <div style={{ width:44, height:44, borderRadius:"50%", background:C.saffronBg, border:`1.5px solid ${C.saffron}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:700, color:C.saffron, flexShrink:0 }}>{b.avatar}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                    <div style={{ fontWeight:700, fontSize:15, color:C.text }}>{b.ceremony}</div>
                    <Badge status={b.status}/>
                  </div>
                  <div style={{ fontSize:12, color:C.textLight, marginBottom:8 }}>{b.customer} · {b.city}</div>
                  <div style={{ display:"flex", gap:16, fontSize:12, color:C.textMid, flexWrap:"wrap" }}>
                    <span>📅 {b.date}</span>
                    <span>⏰ {b.time}</span>
                    <span>📦 Samagri: {b.samagri}</span>
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontSize:18, fontWeight:700, color:C.saffron }}>₹{b.amount.toLocaleString()}</div>
                  <div style={{ fontSize:11, color:C.textLight }}>{b.id}</div>
                </div>
              </div>

              {/* Pending quick actions inline */}
              {b.status==="Pending" && (
                <div style={{ display:"flex", gap:10, marginTop:12, paddingTop:12, borderTop:`1px solid ${C.border}` }}>
                  <button onClick={e=>{e.stopPropagation();}} style={{ flex:1, padding:"9px", borderRadius:9, border:"none", background:C.green, color:C.white, fontWeight:700, fontSize:12, cursor:"pointer" }}>✓ Accept Booking</button>
                  <button onClick={e=>{e.stopPropagation();}} style={{ padding:"9px 16px", borderRadius:9, border:`1px solid ${C.red}`, background:"transparent", color:C.red, fontWeight:600, fontSize:12, cursor:"pointer" }}>✕ Decline</button>
                </div>
              )}
            </div>
          ))}
          {filtered.length===0 && <div style={{ textAlign:"center", padding:"40px 0", color:C.textLight, fontSize:14 }}>No {filter.toLowerCase()} bookings.</div>}
        </div>

        {/* Detail panel */}
        {selected && (
          <Card style={{ padding:"22px", position:"sticky", top:20, alignSelf:"start" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontFamily:"'Georgia',serif", fontSize:17, color:C.text }}>Booking Details</div>
              <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", color:C.textLight, fontSize:18, cursor:"pointer" }}>✕</button>
            </div>

            {/* Customer */}
            <div style={{ display:"flex", gap:12, alignItems:"center", background:C.bgLight, borderRadius:12, padding:"14px", marginBottom:16 }}>
              <div style={{ width:44, height:44, borderRadius:"50%", background:C.saffronBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, color:C.saffron }}>{selected.avatar}</div>
              <div>
                <div style={{ fontWeight:700, fontSize:15, color:C.text }}>{selected.customer}</div>
                <div style={{ fontSize:12, color:C.textLight }}>{selected.city}</div>
              </div>
            </div>

            {[
              ["Ceremony",  selected.ceremony],
              ["Date",      selected.date],
              ["Time",      selected.time],
              ["Samagri",   selected.samagri],
              ["Amount",    `₹${selected.amount.toLocaleString()}`],
              ["Booking ID",selected.id],
            ].map(([k,v])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:10, fontSize:13 }}>
                <span style={{ color:C.textLight }}>{k}</span>
                <span style={{ fontWeight:600, color:C.text }}>{v}</span>
              </div>
            ))}

            <div style={{ borderTop:`1px solid ${C.border}`, marginTop:16, paddingTop:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.textMid, marginBottom:10, textTransform:"uppercase", letterSpacing:0.6 }}>Actions</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {selected.status==="Pending" && <>
                  <button style={{ padding:"10px", borderRadius:9, border:"none", background:C.green, color:C.white, fontWeight:700, fontSize:13, cursor:"pointer" }}>✓ Accept Booking</button>
                  <button style={{ padding:"10px", borderRadius:9, border:`1px solid ${C.red}`, background:"transparent", color:C.red, fontWeight:600, fontSize:13, cursor:"pointer" }}>✕ Decline Booking</button>
                </>}
                {selected.status==="Confirmed" && <>
                  <button style={{ padding:"10px", borderRadius:9, border:"none", background:C.saffron, color:C.white, fontWeight:700, fontSize:13, cursor:"pointer" }}>✅ Mark Completed</button>
                  <button style={{ padding:"10px", borderRadius:9, border:`1px solid ${C.border}`, background:"transparent", color:C.textMid, fontWeight:600, fontSize:13, cursor:"pointer" }}>💬 Chat with Customer</button>
                </>}
                {selected.status==="Completed" && (
                  <button style={{ padding:"10px", borderRadius:9, border:`1px solid ${C.gold}`, background:"transparent", color:C.gold, fontWeight:600, fontSize:13, cursor:"pointer" }}>📄 View Invoice</button>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── AVAILABILITY ─────────────────────────────────────────────────────────────
function AvailabilityView() {
  const today = new Date(2026,5,1); // June 2026
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [blocked,   setBlocked]   = useState(new Set(BLOCKED_DATES));
  const [workHours, setWorkHours] = useState({ start:"08:00", end:"20:00" });
  const [workDays,  setWorkDays]  = useState(new Set([1,2,3,4,5,6])); // Mon-Sat
  const [selDate,   setSelDate]   = useState(null);
  const [unavailToday, setUnavailToday] = useState(false);

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
  const cells       = Array(firstDay).fill(null).concat(Array.from({length:daysInMonth},(_,i)=>i+1));

  const isBlocked  = d => blocked.has(d);
  const isPast     = d => new Date(viewYear,viewMonth,d) < new Date(today.getFullYear(),today.getMonth(),today.getDate());
  const isToday    = d => d===today.getDate() && viewMonth===today.getMonth() && viewYear===today.getFullYear();
  const isSel      = d => selDate===d;
  const hasBooking = d => bookings.some(b=>b.date===`${d} ${MONTHS[viewMonth]} ${viewYear}`);
  const dayOfWeek  = d => new Date(viewYear,viewMonth,d).getDay();
  const isOffDay   = d => !workDays.has(dayOfWeek(d));

  const toggleBlock = d => {
    if(isPast(d)||hasBooking(d)) return;
    setBlocked(prev => { const n=new Set(prev); n.has(d)?n.delete(d):n.add(d); return n; });
    setSelDate(d);
  };

  const prevM = () => viewMonth===0 ? (setViewMonth(11),setViewYear(y=>y-1)) : setViewMonth(m=>m-1);
  const nextM = () => viewMonth===11? (setViewMonth(0), setViewYear(y=>y+1)) : setViewMonth(m=>m+1);

  const toggleWorkDay = d => setWorkDays(prev=>{ const n=new Set(prev); n.has(d)?n.delete(d):n.add(d); return n; });

  const bookedDates = bookings.filter(b=>b.status==="Confirmed"||b.status==="Pending").length;

  return (
    <div>
      <SectionTitle title="Availability Calendar" sub="Manage your schedule and block dates"/>

      {/* Emergency toggle */}
      <div style={{ background:unavailToday?C.redBg:C.bgCard, border:`1px solid ${unavailToday?C.red:C.border}`, borderRadius:14, padding:"14px 18px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:unavailToday?C.red:C.text }}>⚡ Emergency Unavailability</div>
          <div style={{ fontSize:12, color:C.textLight, marginTop:2 }}>Toggle to instantly block all bookings for today</div>
        </div>
        <div onClick={()=>setUnavailToday(v=>!v)} style={{ width:48, height:26, borderRadius:13, background:unavailToday?C.red:C.bgLight, position:"relative", cursor:"pointer", border:`1px solid ${unavailToday?C.red:C.border}`, transition:"all 0.2s" }}>
          <div style={{ position:"absolute", top:3, left:unavailToday?24:3, width:20, height:20, borderRadius:"50%", background:C.white, transition:"left 0.2s" }}/>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:24 }}>
        {/* Calendar */}
        <Card style={{ padding:22 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
            <button onClick={prevM} style={{ width:32, height:32, border:"none", background:C.bgLight, borderRadius:8, cursor:"pointer", fontSize:15, color:C.textMid }}>‹</button>
            <span style={{ fontFamily:"'Georgia',serif", fontWeight:700, fontSize:17, color:C.text }}>{MONTHS[viewMonth]} {viewYear}</span>
            <button onClick={nextM} style={{ width:32, height:32, border:"none", background:C.bgLight, borderRadius:8, cursor:"pointer", fontSize:15, color:C.textMid }}>›</button>
          </div>

          {/* Day headers */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:8 }}>
            {FULL_DAYS.map((d,i)=>(
              <div key={d} style={{ textAlign:"center", fontSize:11, color:i===0?C.red:C.textLight, fontWeight:700, padding:"4px 0" }}>{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
            {cells.map((d,i)=>{
              if(!d) return <div key={i}/>;
              const past=isPast(d), bkd=hasBooking(d), blk=isBlocked(d), off=isOffDay(d), tod=isToday(d), sel=isSel(d);
              let bg="transparent", color=C.textMid, border="1.5px solid transparent";
              if(sel)   { bg=C.saffron;  color=C.white; }
              else if(bkd)  { bg=C.goldBg;   color=C.gold; border=`1.5px solid ${C.gold}44`; }
              else if(blk)  { bg=C.redBg;    color=C.red; }
              else if(off)  { color=C.bgLight; }
              else if(past) { color=`${C.textLight}44`; }
              else if(tod)  { border=`1.5px solid ${C.saffron}`; color=C.saffron; }
              return (
                <div key={d} onClick={()=>!past&&!off&&toggleBlock(d)} style={{ height:38, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", borderRadius:9, fontSize:12, fontWeight:bkd||tod?700:400, cursor:past||off?"default":"pointer", background:bg, color, border, transition:"all 0.15s", gap:2 }}>
                  {d}
                  {bkd&&<div style={{ width:4, height:4, borderRadius:"50%", background:C.gold }}/>}
                  {blk&&!bkd&&<div style={{ width:4, height:4, borderRadius:"50%", background:C.red }}/>}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display:"flex", gap:14, marginTop:14, paddingTop:12, borderTop:`1px solid ${C.border}`, flexWrap:"wrap" }}>
            {[["🟠","Selected"],[`rgba(212,160,23,0.3)`,"Has Booking",C.gold],["transparent","Available",C.saffron],["redBg","Blocked",C.red]].map(([_,label,color])=>(
              <div key={label} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:C.textLight }}>
                <div style={{ width:10, height:10, borderRadius:3, background:label==="Blocked"?C.redBg:label==="Has Booking"?C.goldBg:label==="Selected"?C.saffron:C.bgLight, border:`1px solid ${color||C.border}` }}/>
                {label}
              </div>
            ))}
          </div>
        </Card>

        {/* Settings panel */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* Work days */}
          <Card style={{ padding:"18px" }}>
            <div style={{ fontFamily:"'Georgia',serif", fontSize:15, color:C.text, marginBottom:14 }}>Working Days</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:6 }}>
              {FULL_DAYS.map((d,i)=>(
                <div key={d} onClick={()=>toggleWorkDay(i)} style={{ height:36, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:8, fontSize:11, fontWeight:700, cursor:"pointer", background:workDays.has(i)?C.saffron:C.bgLight, color:workDays.has(i)?C.white:C.textLight, transition:"all 0.15s" }}>{d[0]}</div>
              ))}
            </div>
          </Card>

          {/* Work hours */}
          <Card style={{ padding:"18px" }}>
            <div style={{ fontFamily:"'Georgia',serif", fontSize:15, color:C.text, marginBottom:14 }}>Working Hours</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[["Start Time","start"],["End Time","end"]].map(([label,key])=>(
                <div key={key}>
                  <label style={{ display:"block", fontSize:11, color:C.textLight, fontWeight:600, marginBottom:6, textTransform:"uppercase", letterSpacing:0.6 }}>{label}</label>
                  <input type="time" value={workHours[key]} onChange={e=>setWorkHours(v=>({...v,[key]:e.target.value}))} style={{ width:"100%", padding:"10px 12px", borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:14, color:C.text, background:C.bgLight, outline:"none", boxSizing:"border-box", colorScheme:"dark" }}/>
                </div>
              ))}
            </div>
          </Card>

          {/* Monthly summary */}
          <Card style={{ padding:"18px" }}>
            <div style={{ fontFamily:"'Georgia',serif", fontSize:15, color:C.text, marginBottom:14 }}>June Summary</div>
            {[["Total Working Days","22"],["Booked Days",bookedDates],["Blocked Days",blocked.size],["Available Days",`${22-bookedDates-blocked.size}`]].map(([k,v])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:10, fontSize:12 }}>
                <span style={{ color:C.textLight }}>{k}</span>
                <span style={{ fontWeight:700, color:C.text }}>{v}</span>
              </div>
            ))}
            <button style={{ width:"100%", marginTop:8, padding:"10px", borderRadius:9, border:"none", background:C.saffron, color:C.white, fontWeight:700, fontSize:13, cursor:"pointer" }}>Save Schedule</button>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── EARNINGS ─────────────────────────────────────────────────────────────────
function EarningsView() {
  const maxAmt = Math.max(...earningsData.monthly.map(m=>m.amt));
  const growth = Math.round(((earningsData.thisMonth - earningsData.lastMonth) / earningsData.lastMonth) * 100);

  return (
    <div>
      <SectionTitle title="Earnings & Payouts" sub="Track your income and payout history"/>

      {/* Top stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        <StatCard icon="💰" label="This Month"  value={`₹${earningsData.thisMonth.toLocaleString()}`}  trend={growth} color={C.saffron}/>
        <StatCard icon="📅" label="Last Month"  value={`₹${earningsData.lastMonth.toLocaleString()}`}  color={C.textMid}/>
        <StatCard icon="📈" label="This Year"   value={`₹${(earningsData.thisYear/100000).toFixed(1)}L`} sub="Total 2026"  color={C.gold}/>
        <StatCard icon="⏳" label="Pending"     value={`₹${earningsData.pending.toLocaleString()}`}    sub="Next: 1 Jul" color={C.marigold}/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:20 }}>
        {/* Bar chart */}
        <Card style={{ padding:"24px" }}>
          <div style={{ fontFamily:"'Georgia',serif", fontSize:17, color:C.text, marginBottom:20 }}>Revenue Trend — 2026</div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:180 }}>
            {earningsData.monthly.map((m,i)=>{
              const pct = m.amt/maxAmt;
              const isCurrent = i===earningsData.monthly.length-1;
              return (
                <div key={m.month} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                  <div style={{ fontSize:10, color:isCurrent?C.saffron:C.textLight, fontWeight:isCurrent?700:400 }}>₹{(m.amt/1000).toFixed(0)}K</div>
                  <div style={{ width:"100%", borderRadius:"6px 6px 0 0", background:isCurrent?C.saffron:`${C.saffron}44`, height:`${pct*140}px`, transition:"height 0.5s", minHeight:8 }}/>
                  <div style={{ fontSize:11, color:isCurrent?C.saffron:C.textLight, fontWeight:isCurrent?700:400 }}>{m.month}</div>
                </div>
              );
            })}
          </div>

          {/* Breakdown */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginTop:24, paddingTop:20, borderTop:`1px solid ${C.border}` }}>
            {[["Pandit Charges","₹16,000","86%",C.saffron],["Platform Fee (10%)","–₹1,850","–",C.red],["Net Earnings","₹14,650","79%",C.green]].map(([k,v,pct,color])=>(
              <div key={k} style={{ textAlign:"center", padding:"12px", background:C.bgLight, borderRadius:10 }}>
                <div style={{ fontSize:18, fontWeight:700, color }}>{v}</div>
                <div style={{ fontSize:11, color:C.textLight, marginTop:4 }}>{k}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Payout history + bank */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <Card style={{ padding:"18px" }}>
            <div style={{ fontFamily:"'Georgia',serif", fontSize:15, color:C.text, marginBottom:14 }}>Payout History</div>
            {earningsData.payouts.map(p=>(
              <div key={p.id} style={{ marginBottom:12, paddingBottom:12, borderBottom:`1px solid ${C.border}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontWeight:700, fontSize:14, color:C.text }}>₹{p.amount.toLocaleString()}</span>
                  <span style={{ fontSize:10, color:C.green, background:C.greenBg, padding:"2px 8px", borderRadius:999, fontWeight:700 }}>✓ {p.status}</span>
                </div>
                <div style={{ fontSize:11, color:C.textLight }}>{p.date} · {p.method}</div>
              </div>
            ))}
            <button style={{ width:"100%", padding:"9px", borderRadius:9, border:`1px solid ${C.border}`, background:"transparent", color:C.textMid, fontWeight:600, fontSize:12, cursor:"pointer" }}>View All Payouts →</button>
          </Card>

          <Card style={{ padding:"18px" }}>
            <div style={{ fontFamily:"'Georgia',serif", fontSize:15, color:C.text, marginBottom:14 }}>Bank Details</div>
            {[["Account","HDFC Bank · ****4821"],["IFSC","HDFC0001234"],["UPI","ramesh@hdfc"],["Next Payout","1 Jul 2026"]].map(([k,v])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:9, fontSize:12 }}>
                <span style={{ color:C.textLight }}>{k}</span>
                <span style={{ fontWeight:600, color:C.text }}>{v}</span>
              </div>
            ))}
            <button style={{ width:"100%", marginTop:8, padding:"9px", borderRadius:9, border:`1px solid ${C.border}`, background:"transparent", color:C.saffron, fontWeight:600, fontSize:12, cursor:"pointer" }}>✏️ Update Bank Details</button>
          </Card>
        </div>
      </div>

      {/* Booking-wise earnings */}
      <Card style={{ padding:"22px", marginTop:20 }}>
        <div style={{ fontFamily:"'Georgia',serif", fontSize:17, color:C.text, marginBottom:16 }}>Booking-wise Earnings — June 2026</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr 1fr", padding:"10px 14px", marginBottom:8, fontSize:11, color:C.textLight, fontWeight:700, textTransform:"uppercase", letterSpacing:0.6 }}>
          {["Booking","Customer","Ceremony","Date","Gross","Net"].map(h=><span key={h}>{h}</span>)}
        </div>
        {bookings.filter(b=>b.status==="Completed"||b.status==="Confirmed").slice(0,4).map((b,i)=>(
          <div key={b.id} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr 1fr", padding:"12px 14px", background:i%2===0?C.bgLight:"transparent", borderRadius:9, marginBottom:4, fontSize:13, alignItems:"center" }}>
            <span style={{ color:C.textLight, fontSize:11 }}>{b.id}</span>
            <span style={{ color:C.text, fontWeight:500 }}>{b.customer}</span>
            <span style={{ color:C.textMid }}>{b.ceremony}</span>
            <span style={{ color:C.textLight, fontSize:11 }}>{b.date}</span>
            <span style={{ fontWeight:700, color:C.text }}>₹{b.amount.toLocaleString()}</span>
            <span style={{ fontWeight:700, color:C.green }}>₹{Math.round(b.amount*0.9).toLocaleString()}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
const NAV = [
  { id:"dashboard",    label:"Dashboard",   icon:"🏠" },
  { id:"bookings",     label:"Bookings",    icon:"📅" },
  { id:"availability", label:"Availability",icon:"🗓️" },
  { id:"earnings",     label:"Earnings",    icon:"💰" },
];

export default function PanditPanel() {
  const [view,    setView]    = useState("dashboard");
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Segoe UI','Helvetica Neue',sans-serif", color:C.text }}>

      {/* Top bar */}
      <nav style={{ background:C.bgCard, borderBottom:`1px solid ${C.border}`, padding:"0 20px", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ maxWidth:1200, margin:"0 auto", height:58, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:20 }}>🪔</span>
            <span style={{ fontFamily:"'Georgia',serif", fontWeight:700, fontSize:15, color:C.saffron }}>TheKhatuMart</span>
            <span style={{ color:C.border, margin:"0 6px" }}>›</span>
            <span style={{ fontSize:13, color:C.textMid }}>Pandit Panel</span>
          </div>

          {/* Desktop nav */}
          <div style={{ display:"flex", gap:2 }}>
            {NAV.map(n=>(
              <button key={n.id} onClick={()=>setView(n.id)} style={{ padding:"8px 16px", borderRadius:9, border:"none", background:view===n.id?C.saffronBg:"transparent", color:view===n.id?C.saffron:C.textMid, fontWeight:view===n.id?700:400, fontSize:13, cursor:"pointer", transition:"all 0.15s" }}>
                {n.icon} {n.label}
              </button>
            ))}
          </div>

          {/* Pandit avatar */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:12, fontWeight:600, color:C.text }}>{pandit.name.split(" ").slice(0,2).join(" ")}</div>
              <div style={{ fontSize:10, color:C.textLight }}>🏅 {pandit.tier}</div>
            </div>
            <div style={{ width:34, height:34, borderRadius:"50%", background:C.saffronBg, border:`2px solid ${C.saffron}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>{pandit.avatar}</div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"28px 20px 80px" }}>
        {view==="dashboard"    && <DashboardView    setView={setView}/>}
        {view==="bookings"     && <BookingsView/>}
        {view==="availability" && <AvailabilityView/>}
        {view==="earnings"     && <EarningsView/>}
      </div>

      {/* Mobile bottom nav */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:C.bgCard, borderTop:`1px solid ${C.border}`, display:"flex", zIndex:50, padding:"8px 0 10px" }}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>setView(n.id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, border:"none", background:"transparent", color:view===n.id?C.saffron:C.textLight, cursor:"pointer", padding:"4px 0", transition:"color 0.15s" }}>
            <span style={{ fontSize:18 }}>{n.icon}</span>
            <span style={{ fontSize:9, fontWeight:view===n.id?700:400 }}>{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
