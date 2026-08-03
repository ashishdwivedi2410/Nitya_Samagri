import { useState } from "react";
 
const C = {
  saffron: "#E8560A",
  saffronLight: "#F47B3A",
  saffronBg: "#FFF3EC",
  marigold: "#F5A623",
  marigoldLight: "#FAC65A",
  deepRed: "#8B1A1A",
  cream: "#FFF8EE",
  creamDark: "#F0E4CE",
  bark: "#5C3317",
  gold: "#C8860A",
  text: "#2C1A0E",
  textMid: "#5C3D20",
  textLight: "#9A7050",
  white: "#FFFFFF",
  green: "#1A7A3C",
  greenBg: "#EDFAF3",
  border: "#E8D8BC",
};
 
const pandits = [
  {
    id: 1, name: "Pt. Ramesh Sharma", avatar: "🧘", exp: "18 yrs", city: "Delhi",
    lang: ["Hindi", "Sanskrit"], rating: 4.9, reviews: 412, totalBookings: 1820,
    speciality: "Satyanarayan Katha, Griha Pravesh, Navgrah Shanti",
    bio: "18+ years performing sacred ceremonies across Delhi NCR. Trained at Kashi Vishwanath temple. Known for punctuality and clear vidhi narration.",
    verified: true, available: true,
    services: [
      { id: "s1", name: "Satyanarayan Katha", duration: "3-4 hrs", price: 2500, samagri: "platform" },
      { id: "s2", name: "Griha Pravesh", duration: "2-3 hrs", price: 3500, samagri: "platform" },
      { id: "s3", name: "Navgrah Shanti Havan", duration: "4-5 hrs", price: 4500, samagri: "pandit" },
      { id: "s4", name: "Vastu Puja", duration: "2 hrs", price: 2000, samagri: "customer" },
    ],
    reviews_list: [
      { name: "Priya Verma", rating: 5, text: "Very knowledgeable and punctual. Explained every step clearly.", date: "12 May 2026" },
      { name: "Amit Gupta", rating: 5, text: "Excellent puja. Would definitely book again for Diwali.", date: "8 May 2026" },
      { name: "Sunita Rao", rating: 4, text: "Great experience overall. Arrived on time with all materials.", date: "2 May 2026" },
    ],
  },
  {
    id: 2, name: "Pt. Suresh Mishra", avatar: "🙏", exp: "24 yrs", city: "Jaipur",
    lang: ["Hindi", "Sanskrit", "English"], rating: 5.0, reviews: 287, totalBookings: 1350,
    speciality: "Rudrabhishek, Havan, Marriage Ceremonies",
    bio: "24 years of Vedic practice specialising in Shiva rituals and marriage ceremonies. Fluent in English for NRI families. Served at Birla Mandir, Jaipur for 8 years.",
    verified: true, available: true,
    services: [
      { id: "s5", name: "Rudrabhishek", duration: "2-3 hrs", price: 3500, samagri: "platform" },
      { id: "s6", name: "Vivah Sanskar", duration: "5-6 hrs", price: 11000, samagri: "platform" },
      { id: "s7", name: "Maha Mrityunjaya Jaap", duration: "3 hrs", price: 4000, samagri: "pandit" },
      { id: "s8", name: "Bhoomi Pujan", duration: "1-2 hrs", price: 2500, samagri: "customer" },
    ],
    reviews_list: [
      { name: "Rohit Sharma", rating: 5, text: "Perfect. Every mantra recited with full concentration.", date: "15 May 2026" },
      { name: "Neha Jain", rating: 5, text: "Our Rudrabhishek was flawless. Highly recommended.", date: "10 May 2026" },
    ],
  },
  {
    id: 3, name: "Pt. Vijay Pandey", avatar: "🔱", exp: "12 yrs", city: "Noida",
    lang: ["Hindi", "Sanskrit"], rating: 4.8, reviews: 198, totalBookings: 890,
    speciality: "Mundan Sanskar, Namkaran, Annaprashana",
    bio: "Specialises in child Sanskars. Creates a calm, joyful atmosphere. Based in Noida, available across NCR.",
    verified: true, available: false,
    services: [
      { id: "s9", name: "Mundan Sanskar", duration: "1-2 hrs", price: 2000, samagri: "platform" },
      { id: "s10", name: "Namkaran Ceremony", duration: "1 hr", price: 1500, samagri: "platform" },
      { id: "s11", name: "Annaprashana", duration: "1 hr", price: 1200, samagri: "customer" },
    ],
    reviews_list: [
      { name: "Kavita Singh", rating: 5, text: "Lovely pandit. Made our baby's Mundan very special.", date: "20 Apr 2026" },
    ],
  },
];
 
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const SLOTS = ["08:00 AM","09:00 AM","10:00 AM","11:00 AM","12:00 PM","02:00 PM","03:00 PM","04:00 PM","05:00 PM","06:00 PM"];
const BOOKED_SLOTS = ["09:00 AM","02:00 PM"];
const STEP_LABELS = ["Select Pandit","Choose Service","Date & Time","Your Details","Confirm"];
 
function Stars({ n }) {
  return <span style={{ color: C.marigold, fontSize: 13 }}>{"★".repeat(Math.floor(n))}{"☆".repeat(5-Math.floor(n))}</span>;
}
 
function Badge({ children, color, bg }) {
  return <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:bg, color, fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:999 }}>{children}</span>;
}
 
function SamagriLabel({ type }) {
  const map = {
    platform: ["📦 Samagri included", C.green, C.greenBg],
    pandit: ["🙏 Pandit brings samagri", C.gold, "#FFFBE8"],
    customer: ["⚠️ You arrange samagri", C.deepRed, "#FFF0EE"]
  };
  const [label, color, bg] = map[type] || map.customer;
  return <Badge color={color} bg={bg}>{label}</Badge>;
}
 
function PanditCard({ pandit, selected, onClick }) {
  return (
    <div onClick={() => pandit.available && onClick(pandit)} style={{
      background: C.white, borderRadius: 16,
      border: `2px solid ${selected ? C.saffron : C.border}`,
      padding: "20px", cursor: pandit.available ? "pointer" : "not-allowed",
      opacity: pandit.available ? 1 : 0.55,
      boxShadow: selected ? `0 0 0 4px ${C.saffron}22` : "none",
      transition: "all 0.2s",
    }}>
      <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
        <div style={{ width:60, height:60, borderRadius:"50%", background:C.cream, border:`2px solid ${C.marigoldLight}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0 }}>{pandit.avatar}</div>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
            <span style={{ fontWeight:700, fontSize:15, color:C.text }}>{pandit.name}</span>
            {pandit.verified && <Badge color={C.green} bg={C.greenBg}>✓ Verified</Badge>}
            {!pandit.available && <Badge color={C.deepRed} bg="#FFF0EE">Unavailable Today</Badge>}
          </div>
          <div style={{ fontSize:12, color:C.textLight, marginBottom:6 }}>{pandit.exp} · {pandit.city} · {pandit.lang.join(", ")}</div>
          <div style={{ fontSize:12, color:C.textMid, fontStyle:"italic", marginBottom:10 }}>{pandit.speciality}</div>
          <div style={{ display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" }}>
            <div><Stars n={pandit.rating} /> <span style={{ fontSize:11, color:C.textLight }}>({pandit.reviews})</span></div>
            <span style={{ fontSize:12, color:C.textLight }}>📋 {pandit.totalBookings.toLocaleString()} bookings</span>
            <span style={{ fontSize:13, fontWeight:700, color:C.saffron }}>From ₹{Math.min(...pandit.services.map(s=>s.price)).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
 
function CalendarPicker({ selectedDate, onSelect }) {
  const today = new Date(2026, 4, 30);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = Array(firstDay).fill(null).concat(Array.from({length: daysInMonth}, (_,i) => i+1));
  const isPast = (d) => new Date(viewYear, viewMonth, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isSelected = (d) => selectedDate && selectedDate.day===d && selectedDate.month===viewMonth && selectedDate.year===viewYear;
  const isToday = (d) => d===today.getDate() && viewMonth===today.getMonth() && viewYear===today.getFullYear();
  const prev = () => viewMonth===0 ? (setViewMonth(11),setViewYear(y=>y-1)) : setViewMonth(m=>m-1);
  const next = () => viewMonth===11 ? (setViewMonth(0),setViewYear(y=>y+1)) : setViewMonth(m=>m+1);
  return (
    <div style={{ background:C.white, borderRadius:14, border:`1px solid ${C.border}`, padding:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <button onClick={prev} style={{ border:"none", background:C.cream, borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:14, color:C.textMid }}>‹</button>
        <span style={{ fontWeight:700, fontSize:15, color:C.text }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={next} style={{ border:"none", background:C.cream, borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:14, color:C.textMid }}>›</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:8 }}>
        {DAYS.map(d => <div key={d} style={{ textAlign:"center", fontSize:11, color:C.textLight, fontWeight:600, padding:"4px 0" }}>{d}</div>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
        {cells.map((d,i) => (
          <div key={i} onClick={() => d && !isPast(d) && onSelect({day:d,month:viewMonth,year:viewYear})} style={{
            height:36, display:"flex", alignItems:"center", justifyContent:"center",
            borderRadius:8, fontSize:13, fontWeight:isToday(d)?700:400,
            cursor: d && !isPast(d) ? "pointer" : "default",
            background: isSelected(d) ? C.saffron : isToday(d) ? C.saffronBg : "transparent",
            color: isSelected(d) ? C.white : d && isPast(d) ? C.creamDark : isToday(d) ? C.saffron : C.text,
            border: isToday(d) && !isSelected(d) ? `1.5px solid ${C.saffron}` : "1.5px solid transparent",
            transition:"all 0.15s",
          }}>{d || ""}</div>
        ))}
      </div>
    </div>
  );
}
 
export default function PanditBooking() {
  const [step, setStep] = useState(0);
  const [selectedPandit, setSelectedPandit] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [filter, setFilter] = useState({ city:"all", lang:"all" });
  const [details, setDetails] = useState({ name:"", phone:"", email:"", address:"", notes:"", participants:"", lang:"Hindi" });
  const [samagriChoice, setSamagriChoice] = useState("platform");
  const [booked, setBooked] = useState(false);
 
  const fPandits = pandits.filter(p => {
    if (filter.city !== "all" && p.city !== filter.city) return false;
    if (filter.lang !== "all" && !p.lang.includes(filter.lang)) return false;
    return true;
  });
 
  const canNext = () => {
    if (step===0) return !!selectedPandit;
    if (step===1) return !!selectedService;
    if (step===2) return !!selectedDate && !!selectedSlot;
    if (step===3) return !!(details.name && details.phone && details.address);
    return true;
  };
 
  const dateStr = selectedDate ? `${selectedDate.day} ${MONTHS[selectedDate.month]} ${selectedDate.year}` : "";
  const totalAmt = selectedService ? selectedService.price + (samagriChoice==="platform" ? 299 : 0) : 0;
 
  const resetAll = () => {
    setBooked(false); setStep(0); setSelectedPandit(null); setSelectedService(null);
    setSelectedDate(null); setSelectedSlot(null);
    setDetails({ name:"", phone:"", email:"", address:"", notes:"", participants:"", lang:"Hindi" });
  };
 
  if (booked) return (
    <div style={{ minHeight:"100vh", background:C.cream, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Segoe UI',sans-serif" }}>
      <div style={{ background:C.white, borderRadius:24, padding:"56px 48px", maxWidth:480, width:"100%", textAlign:"center" }}>
        <div style={{ fontSize:64, marginBottom:16 }}>🙏</div>
        <div style={{ fontFamily:"'Georgia',serif", fontSize:28, fontWeight:700, color:C.text, marginBottom:12 }}>Booking Confirmed!</div>
        <div style={{ fontSize:14, color:C.textMid, lineHeight:1.7, marginBottom:28 }}>
          Your booking with <strong>{selectedPandit?.name}</strong> for <strong>{selectedService?.name}</strong> on <strong>{dateStr}</strong> at <strong>{selectedSlot}</strong> is confirmed.
        </div>
        <div style={{ background:C.saffronBg, borderRadius:14, padding:"20px", marginBottom:28, textAlign:"left" }}>
          {[["Booking ID","#BK-2026-00847"],["Pandit",selectedPandit?.name],["Ceremony",selectedService?.name],["Date & Time",`${dateStr}, ${selectedSlot}`],["Amount",`₹${totalAmt.toLocaleString()}`]].map(([k,v])=>(
            <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:10, fontSize:13 }}>
              <span style={{ color:C.textLight }}>{k}</span>
              <span style={{ color:C.text, fontWeight:600 }}>{v}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize:12, color:C.textLight, marginBottom:24 }}>Confirmation sent via SMS and WhatsApp within 15 minutes.</p>
        <button onClick={resetAll} style={{ padding:"12px 32px", borderRadius:10, background:C.saffron, color:C.white, border:"none", fontWeight:700, fontSize:14, cursor:"pointer" }}>
          Book Another Puja
        </button>
      </div>
    </div>
  );
 
  return (
    <div style={{ minHeight:"100vh", background:C.cream, fontFamily:"'Segoe UI',sans-serif" }}>
 
      {/* Top bar */}
      <div style={{ background:C.white, borderBottom:`1px solid ${C.border}`, padding:"16px 24px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:22 }}>🪔</span>
            <span style={{ fontFamily:"'Georgia',serif", fontWeight:700, fontSize:17, color:C.saffron }}>nityasamagri</span>
            <span style={{ color:C.creamDark, margin:"0 6px" }}>›</span>
            <span style={{ fontSize:14, color:C.textMid, fontWeight:500 }}>Book a Pandit</span>
          </div>
          <div style={{ fontSize:12, color:C.textLight }}>📞 +91 8595427053 &nbsp;·&nbsp; 8AM–8PM Support</div>
        </div>
      </div>
 
      {/* Stepper */}
      <div style={{ background:C.white, borderBottom:`1px solid ${C.border}`, padding:"0 24px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", padding:"16px 0" }}>
          {STEP_LABELS.map((label,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", flex: i<STEP_LABELS.length-1 ? 1 : 0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, cursor: i<step?"pointer":"default" }} onClick={() => i<step && setStep(i)}>
                <div style={{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, flexShrink:0,
                  background: i<step ? C.green : i===step ? C.saffron : C.creamDark,
                  color: i<=step ? C.white : C.textLight,
                }}>{i<step ? "✓" : i+1}</div>
                <span style={{ fontSize:12, fontWeight:i===step?700:400, color:i===step?C.saffron:i<step?C.green:C.textLight, whiteSpace:"nowrap" }}>{label}</span>
              </div>
              {i<STEP_LABELS.length-1 && <div style={{ flex:1, height:2, background:i<step?C.green:C.creamDark, margin:"0 12px", borderRadius:1 }} />}
            </div>
          ))}
        </div>
      </div>
 
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"32px 24px" }}>
 
        {/* STEP 0 */}
        {step===0 && (
          <div>
            <h1 style={{ fontFamily:"'Georgia',serif", fontSize:28, color:C.text, margin:"0 0 6px" }}>Find Your Pandit</h1>
            <p style={{ color:C.textLight, fontSize:14, margin:"0 0 24px" }}>All pandits are verified, experienced and rated by real customers.</p>
            <div style={{ display:"flex", gap:10, marginBottom:24, flexWrap:"wrap" }}>
              {[["city","all","All Cities"],["city","Delhi","Delhi"],["city","Jaipur","Jaipur"],["city","Noida","Noida"]].map(([key,val,label])=>(
                <button key={label} onClick={()=>setFilter(f=>({...f,[key]:val}))} style={{ padding:"7px 16px", borderRadius:999, border:`1.5px solid ${filter[key]===val?C.saffron:C.border}`, background:filter[key]===val?C.saffron:C.white, color:filter[key]===val?C.white:C.textMid, fontWeight:600, fontSize:12, cursor:"pointer", transition:"all 0.15s" }}>{label}</button>
              ))}
              <div style={{ width:1, background:C.border }} />
              {[["lang","all","All Languages"],["lang","English","English speakers"]].map(([key,val,label])=>(
                <button key={label} onClick={()=>setFilter(f=>({...f,[key]:val}))} style={{ padding:"7px 16px", borderRadius:999, border:`1.5px solid ${filter[key]===val?C.saffron:C.border}`, background:filter[key]===val?C.saffron:C.white, color:filter[key]===val?C.white:C.textMid, fontWeight:600, fontSize:12, cursor:"pointer", transition:"all 0.15s" }}>{label}</button>
              ))}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {fPandits.map(p=><PanditCard key={p.id} pandit={p} selected={selectedPandit?.id===p.id} onClick={setSelectedPandit}/>)}
            </div>
          </div>
        )}
 
        {/* STEP 1 */}
        {step===1 && selectedPandit && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:32 }}>
            <div>
              <h1 style={{ fontFamily:"'Georgia',serif", fontSize:26, color:C.text, margin:"0 0 6px" }}>Choose a Ceremony</h1>
              <p style={{ color:C.textLight, fontSize:14, margin:"0 0 24px" }}>Select from {selectedPandit.name}'s services.</p>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {selectedPandit.services.map(s=>(
                  <div key={s.id} onClick={()=>setSelectedService(s)} style={{ background:C.white, borderRadius:14, border:`2px solid ${selectedService?.id===s.id?C.saffron:C.border}`, padding:"20px 24px", cursor:"pointer", boxShadow:selectedService?.id===s.id?`0 0 0 4px ${C.saffron}22`:"none", transition:"all 0.2s" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                      <div style={{ fontWeight:700, fontSize:16, color:C.text }}>{s.name}</div>
                      <div style={{ fontWeight:700, fontSize:18, color:C.saffron }}>₹{s.price.toLocaleString()}</div>
                    </div>
                    <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
                      <span style={{ fontSize:12, color:C.textLight }}>⏱ {s.duration}</span>
                      <SamagriLabel type={s.samagri} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:36 }}>
                <h3 style={{ fontFamily:"'Georgia',serif", fontSize:18, color:C.text, margin:"0 0 16px" }}>Customer Reviews</h3>
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  {selectedPandit.reviews_list.map((r,i)=>(
                    <div key={i} style={{ background:C.white, borderRadius:12, border:`1px solid ${C.border}`, padding:"16px 20px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                        <span style={{ fontWeight:600, fontSize:14, color:C.text }}>{r.name}</span>
                        <span style={{ fontSize:11, color:C.textLight }}>{r.date}</span>
                      </div>
                      <Stars n={r.rating}/>
                      <p style={{ fontSize:13, color:C.textMid, margin:"8px 0 0", lineHeight:1.6 }}>{r.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.border}`, padding:"24px", position:"sticky", top:20 }}>
                <div style={{ textAlign:"center", marginBottom:20 }}>
                  <div style={{ fontSize:44, marginBottom:8 }}>{selectedPandit.avatar}</div>
                  <div style={{ fontWeight:700, fontSize:16, color:C.text }}>{selectedPandit.name}</div>
                  <div style={{ fontSize:12, color:C.textLight, marginBottom:8 }}>{selectedPandit.city} · {selectedPandit.exp}</div>
                  <Stars n={selectedPandit.rating}/><span style={{ fontSize:12, color:C.textLight, marginLeft:4 }}>{selectedPandit.rating} ({selectedPandit.reviews})</span>
                </div>
                <p style={{ fontSize:13, color:C.textMid, lineHeight:1.7, borderTop:`1px solid ${C.border}`, paddingTop:16 }}>{selectedPandit.bio}</p>
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:12 }}>
                  {[["🗣️ Languages",selectedPandit.lang.join(", ")],["📍 City",selectedPandit.city],["📋 Bookings",selectedPandit.totalBookings.toLocaleString()]].map(([k,v])=>(
                    <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
                      <span style={{ color:C.textLight }}>{k}</span>
                      <span style={{ fontWeight:600, color:C.text }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
 
        {/* STEP 2 */}
        {step===2 && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:32 }}>
            <div>
              <h1 style={{ fontFamily:"'Georgia',serif", fontSize:26, color:C.text, margin:"0 0 6px" }}>Pick a Date</h1>
              <p style={{ color:C.textLight, fontSize:14, margin:"0 0 20px" }}>Select an auspicious date for your ceremony.</p>
              <CalendarPicker selectedDate={selectedDate} onSelect={setSelectedDate}/>
            </div>
            <div>
              <h1 style={{ fontFamily:"'Georgia',serif", fontSize:26, color:C.text, margin:"0 0 6px" }}>Select a Time Slot</h1>
              <p style={{ color:C.textLight, fontSize:14, margin:"0 0 20px" }}>{selectedDate ? `Available slots on ${dateStr}` : "Choose a date first"}</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
                {SLOTS.map(slot=>{
                  const isBooked=BOOKED_SLOTS.includes(slot);
                  const isActive=selectedSlot===slot;
                  return (
                    <button key={slot} onClick={()=>!isBooked&&selectedDate&&setSelectedSlot(slot)} disabled={isBooked||!selectedDate} style={{ padding:"12px", borderRadius:10, border:`2px solid ${isActive?C.saffron:isBooked?C.creamDark:C.border}`, background:isActive?C.saffron:isBooked?C.cream:C.white, color:isActive?C.white:isBooked?C.textLight:C.text, fontWeight:600, fontSize:13, cursor:isBooked||!selectedDate?"not-allowed":"pointer", opacity:!selectedDate?0.4:1, transition:"all 0.15s" }}>
                      {slot}{isBooked&&<span style={{ display:"block", fontSize:10, fontWeight:400 }}>Booked</span>}
                    </button>
                  );
                })}
              </div>
              {selectedDate&&selectedSlot&&(
                <div style={{ marginTop:20, background:C.greenBg, border:`1px solid ${C.green}44`, borderRadius:12, padding:"14px 18px" }}>
                  <div style={{ fontSize:13, color:C.green, fontWeight:700 }}>✓ {dateStr} at {selectedSlot}</div>
                  <div style={{ fontSize:12, color:C.textLight, marginTop:4 }}>Duration: {selectedService?.duration} · Please be ready 15 mins early.</div>
                </div>
              )}
            </div>
          </div>
        )}
 
        {/* STEP 3 */}
        {step===3 && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:32 }}>
            <div>
              <h1 style={{ fontFamily:"'Georgia',serif", fontSize:26, color:C.text, margin:"0 0 6px" }}>Your Details</h1>
              <p style={{ color:C.textLight, fontSize:14, margin:"0 0 24px" }}>Fill in your contact and ceremony information.</p>
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                {[{label:"Full Name *",key:"name",placeholder:"Rahul Sharma",type:"text"},{label:"Mobile Number *",key:"phone",placeholder:"+91 98765 43210",type:"tel"},{label:"Email Address",key:"email",placeholder:"rahul@email.com",type:"email"}].map(f=>(
                  <div key={f.key}>
                    <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.textMid, marginBottom:6 }}>{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} value={details[f.key]} onChange={e=>setDetails(d=>({...d,[f.key]:e.target.value}))} style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:14, color:C.text, background:C.white, outline:"none", boxSizing:"border-box" }}/>
                  </div>
                ))}
                <div>
                  <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.textMid, marginBottom:6 }}>Ceremony Address *</label>
                  <textarea placeholder="Full address for the ceremony..." value={details.address} onChange={e=>setDetails(d=>({...d,address:e.target.value}))} rows={3} style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:14, color:C.text, background:C.white, outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                  <div>
                    <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.textMid, marginBottom:6 }}>No. of Participants</label>
                    <input type="number" placeholder="e.g. 15" value={details.participants} onChange={e=>setDetails(d=>({...d,participants:e.target.value}))} min={1} style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:14, color:C.text, background:C.white, outline:"none", boxSizing:"border-box" }}/>
                  </div>
                  <div>
                    <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.textMid, marginBottom:6 }}>Preferred Language</label>
                    <select value={details.lang} onChange={e=>setDetails(d=>({...d,lang:e.target.value}))} style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:14, color:C.text, background:C.white, outline:"none", boxSizing:"border-box" }}>
                      {selectedPandit?.lang.map(l=><option key={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                {selectedService?.samagri==="platform" && (
                  <div>
                    <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.textMid, marginBottom:10 }}>Puja Samagri</label>
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      {[{val:"platform",icon:"📦",label:"Add samagri kit (₹299)",sub:"All required items delivered to your doorstep."},{val:"self",icon:"🏪",label:"I will arrange samagri myself",sub:"You source items as per the pandit's list."}].map(opt=>(
                        <div key={opt.val} onClick={()=>setSamagriChoice(opt.val)} style={{ display:"flex", gap:12, padding:"14px 16px", borderRadius:12, border:`2px solid ${samagriChoice===opt.val?C.saffron:C.border}`, background:samagriChoice===opt.val?C.saffronBg:C.white, cursor:"pointer", transition:"all 0.15s" }}>
                          <span style={{ fontSize:22 }}>{opt.icon}</span>
                          <div><div style={{ fontWeight:600, fontSize:13, color:C.text, marginBottom:2 }}>{opt.label}</div><div style={{ fontSize:12, color:C.textLight }}>{opt.sub}</div></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.textMid, marginBottom:6 }}>Special Instructions (optional)</label>
                  <textarea placeholder="Any requests for the pandit..." value={details.notes} onChange={e=>setDetails(d=>({...d,notes:e.target.value}))} rows={2} style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:14, color:C.text, background:C.white, outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
                </div>
              </div>
            </div>
            <div>
              <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.border}`, padding:"24px", position:"sticky", top:20 }}>
                <h3 style={{ fontFamily:"'Georgia',serif", fontSize:18, color:C.text, margin:"0 0 20px" }}>Booking Summary</h3>
                {[["Pandit",selectedPandit?.name],["Ceremony",selectedService?.name],["Date",dateStr],["Time",selectedSlot],["Duration",selectedService?.duration]].map(([k,v])=>v&&(
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:12, fontSize:13 }}>
                    <span style={{ color:C.textLight }}>{k}</span>
                    <span style={{ color:C.text, fontWeight:600, textAlign:"right", maxWidth:180 }}>{v}</span>
                  </div>
                ))}
                <div style={{ borderTop:`1px solid ${C.border}`, marginTop:16, paddingTop:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:8 }}><span style={{ color:C.textLight }}>Pandit charges</span><span style={{ fontWeight:600 }}>₹{selectedService?.price.toLocaleString()}</span></div>
                  {samagriChoice==="platform"&&<div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:8 }}><span style={{ color:C.textLight }}>Samagri kit</span><span style={{ fontWeight:600 }}>₹299</span></div>}
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:8 }}><span style={{ color:C.textLight }}>Platform fee</span><span style={{ color:C.green, fontWeight:600 }}>FREE</span></div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:16, fontWeight:700, marginTop:12, paddingTop:12, borderTop:`1px dashed ${C.border}` }}>
                    <span style={{ color:C.text }}>Total</span><span style={{ color:C.saffron }}>₹{totalAmt.toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ marginTop:14, fontSize:11, color:C.textLight, lineHeight:1.7 }}>✓ Instant confirmation &nbsp;·&nbsp; ✓ Free cancellation 24hrs before &nbsp;·&nbsp; ✓ Secure payment</div>
              </div>
            </div>
          </div>
        )}
 
        {/* STEP 4 */}
        {step===4 && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:32 }}>
            <div>
              <h1 style={{ fontFamily:"'Georgia',serif", fontSize:26, color:C.text, margin:"0 0 6px" }}>Review & Confirm</h1>
              <p style={{ color:C.textLight, fontSize:14, margin:"0 0 24px" }}>Verify all details before confirming your booking.</p>
              {[
                {title:"Pandit", items:[["Name",selectedPandit?.name],["Experience",selectedPandit?.exp],["City",selectedPandit?.city],["Languages",selectedPandit?.lang.join(", ")]]},
                {title:"Ceremony", items:[["Ceremony",selectedService?.name],["Duration",selectedService?.duration],["Date",dateStr],["Time",selectedSlot],["Participants",details.participants||"Not specified"]]},
                {title:"Your Details", items:[["Name",details.name],["Mobile",details.phone],["Email",details.email||"Not provided"],["Address",details.address],["Language",details.lang]]},
              ].map(section=>(
                <div key={section.title} style={{ background:C.white, borderRadius:14, border:`1px solid ${C.border}`, padding:"20px 24px", marginBottom:16 }}>
                  <div style={{ fontWeight:700, fontSize:15, color:C.text, marginBottom:14, paddingBottom:10, borderBottom:`1px solid ${C.border}` }}>{section.title}</div>
                  {section.items.map(([k,v])=>v&&(
                    <div key={k} style={{ display:"flex", gap:16, marginBottom:10, fontSize:13 }}>
                      <span style={{ color:C.textLight, minWidth:100 }}>{k}</span>
                      <span style={{ color:C.text, fontWeight:500 }}>{v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div>
              <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.border}`, padding:"24px", position:"sticky", top:20 }}>
                <h3 style={{ fontFamily:"'Georgia',serif", fontSize:18, color:C.text, margin:"0 0 20px" }}>Payment</h3>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:8 }}><span style={{ color:C.textLight }}>Pandit charges</span><span style={{ fontWeight:600 }}>₹{selectedService?.price.toLocaleString()}</span></div>
                {samagriChoice==="platform"&&<div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:8 }}><span style={{ color:C.textLight }}>Samagri kit</span><span style={{ fontWeight:600 }}>₹299</span></div>}
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:8 }}><span style={{ color:C.textLight }}>Platform fee</span><span style={{ color:C.green, fontWeight:600 }}>FREE</span></div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:18, fontWeight:700, marginTop:12, paddingTop:12, borderTop:`1.5px solid ${C.border}` }}>
                  <span style={{ color:C.text }}>Total</span><span style={{ color:C.saffron }}>₹{totalAmt.toLocaleString()}</span>
                </div>
                <div style={{ marginTop:20, marginBottom:16 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:C.textMid, marginBottom:10 }}>Payment Method</div>
                  {["UPI / PhonePe / GPay","Credit / Debit Card","Net Banking","Cash on Arrival"].map((pm,i)=>(
                    <label key={pm} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, border:`1.5px solid ${i===0?C.saffron:C.border}`, marginBottom:8, cursor:"pointer", background:i===0?C.saffronBg:C.white, fontSize:13, color:C.text, fontWeight:i===0?600:400 }}>
                      <input type="radio" name="payment" defaultChecked={i===0} style={{ accentColor:C.saffron }}/>
                      {pm}
                    </label>
                  ))}
                </div>
                <button onClick={()=>setBooked(true)} style={{ width:"100%", padding:"14px", borderRadius:12, background:C.saffron, color:C.white, border:"none", fontWeight:700, fontSize:15, cursor:"pointer" }}>
                  🙏 Confirm & Pay ₹{totalAmt.toLocaleString()}
                </button>
                <p style={{ fontSize:11, color:C.textLight, textAlign:"center", marginTop:12, lineHeight:1.6 }}>Free cancellation up to 24 hrs before the ceremony.</p>
              </div>
            </div>
          </div>
        )}
 
        {/* Nav buttons */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:36, paddingTop:24, borderTop:`1px solid ${C.border}` }}>
          <button onClick={()=>step>0&&setStep(s=>s-1)} disabled={step===0} style={{ padding:"12px 28px", borderRadius:10, border:`1.5px solid ${C.border}`, background:C.white, color:step===0?C.textLight:C.textMid, fontWeight:600, fontSize:14, cursor:step===0?"not-allowed":"pointer", opacity:step===0?0.5:1 }}>
            ← Back
          </button>
          {step<4 && (
            <button onClick={()=>canNext()&&setStep(s=>s+1)} disabled={!canNext()} style={{ padding:"12px 32px", borderRadius:10, background:canNext()?C.saffron:C.creamDark, color:canNext()?C.white:C.textLight, border:"none", fontWeight:700, fontSize:14, cursor:canNext()?"pointer":"not-allowed", transition:"all 0.2s" }}>
              {step===3?"Review Booking →":"Continue →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

