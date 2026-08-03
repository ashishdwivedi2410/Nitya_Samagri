import { useState, useEffect, useRef } from "react";
 
const COLORS = {
  saffron: "#E8560A",
  saffronLight: "#F47B3A",
  marigold: "#F5A623",
  marigoldLight: "#FAC65A",
  deepRed: "#8B1A1A",
  cream: "#FFF8EE",
  creamDark: "#F5ECD8",
  bark: "#5C3317",
  gold: "#C8860A",
  goldLight: "#E8A020",
  text: "#2C1A0E",
  textMid: "#5C3D20",
  textLight: "#9A7050",
  white: "#FFFFFF",
};
 
const products = [
  { id: 1, name: "Hawan Samagri Kit", category: "Hawan", price: 499, mrp: 649, img: "🪔", rating: 4.8, reviews: 312, badge: "Best Seller" },
  { id: 2, name: "Pure Cow Ghee 500ml", category: "Ghee & Oils", price: 299, mrp: 349, img: "🫙", rating: 4.9, reviews: 521, badge: "Top Rated" },
  { id: 3, name: "Gulab Phool Mala", category: "Phool & Pattiya", price: 50, mrp: 50, img: "🌹", rating: 4.7, reviews: 189, badge: null },
  { id: 4, name: "Rudrabhishek Kit", category: "Puja Samagri", price: 349, mrp: 499, img: "🪬", rating: 4.8, reviews: 274, badge: "30% Off" },
  { id: 5, name: "Mangaldeep Agarbatti", category: "Sugandhit", price: 85, mrp: 99, img: "🕯️", rating: 4.6, reviews: 408, badge: null },
  { id: 6, name: "Navratri Puja Kit", category: "Festival", price: 799, mrp: 1099, img: "🪷", rating: 4.9, reviews: 156, badge: "Festival" },
  { id: 7, name: "Copper Kalash", category: "Utensil", price: 399, mrp: 499, img: "🏺", rating: 4.7, reviews: 203, badge: null },
  { id: 8, name: "Tulsi Mala 108 Beads", category: "General", price: 149, mrp: 199, img: "📿", rating: 4.8, reviews: 367, badge: "Sacred" },
];
 
const pandits = [
  { id: 1, name: "Pt. Ramesh Sharma", exp: "18 yrs", lang: "Hindi, Sanskrit", rating: 4.9, reviews: 412, city: "Delhi", speciality: "Satyanarayan Katha, Griha Pravesh", price: 2500, avatar: "🧘" },
  { id: 2, name: "Pt. Suresh Mishra", exp: "24 yrs", lang: "Hindi, Sanskrit, English", rating: 5.0, reviews: 287, city: "Jaipur", speciality: "Rudrabhishek, Havan", price: 3500, avatar: "🙏" },
  { id: 3, name: "Pt. Vijay Pandey", exp: "12 yrs", lang: "Hindi, Sanskrit", rating: 4.8, reviews: 198, city: "Noida", speciality: "Mundan, Vivah Sanskar", price: 2000, avatar: "🔱" },
];
 
const categories = [
  { name: "Puja Samagri", icon: "🪔", count: 320 },
  { name: "Ghee & Oils", icon: "🫙", count: 48 },
  { name: "Phool & Pattiya", icon: "🌸", count: 64 },
  { name: "Hawan", icon: "🔥", count: 95 },
  { name: "Prashad", icon: "🍬", count: 52 },
  { name: "Idols & Books", icon: "📿", count: 187 },
  { name: "Sugandhit", icon: "🕯️", count: 76 },
  { name: "Utensils", icon: "🏺", count: 43 },
];
 
const festivals = [
  { name: "Navratri", date: "Coming Soon", color: "#D4270C", bg: "#FFF0EE" },
  { name: "Diwali", date: "Oct 2026", color: "#C8860A", bg: "#FFF8EE" },
  { name: "Janmashtami", date: "Aug 2026", color: "#1A5C8B", bg: "#EEF4FF" },
  { name: "Shivratri", date: "Feb 2027", color: "#4A1A6B", bg: "#F4EEFF" },
];
 
function StarRating({ rating }) {
  return (
    <span style={{ color: COLORS.marigold, fontSize: 12, letterSpacing: -1 }}>
      {"★".repeat(Math.floor(rating))}{"☆".repeat(5 - Math.floor(rating))}
      <span style={{ color: COLORS.textLight, marginLeft: 4, fontSize: 11 }}>{rating}</span>
    </span>
  );
}
 
function ProductCard({ product, onAddCart }) {
  const [added, setAdded] = useState(false);
  const disc = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const handleAdd = () => { setAdded(true); onAddCart(product); setTimeout(() => setAdded(false), 1500); };
  return (
    <div style={{
      background: COLORS.white, borderRadius: 16, overflow: "hidden",
      border: `1px solid ${COLORS.creamDark}`, transition: "transform 0.2s, box-shadow 0.2s",
      cursor: "pointer", position: "relative",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(232,86,10,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {product.badge && (
        <div style={{ position: "absolute", top: 12, left: 12, background: COLORS.saffron, color: COLORS.white, fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 999, letterSpacing: 0.5 }}>
          {product.badge}
        </div>
      )}
      {disc > 0 && (
        <div style={{ position: "absolute", top: 12, right: 12, background: COLORS.deepRed, color: COLORS.white, fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 999 }}>
          {disc}% OFF
        </div>
      )}
      <div style={{ background: COLORS.cream, height: 140, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56 }}>
        {product.img}
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ fontSize: 11, color: COLORS.saffron, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>{product.category}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 6, lineHeight: 1.3 }}>{product.name}</div>
        <StarRating rating={product.rating} />
        <span style={{ fontSize: 11, color: COLORS.textLight, marginLeft: 4 }}>({product.reviews})</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>₹{product.price}</span>
          {disc > 0 && <span style={{ fontSize: 13, color: COLORS.textLight, textDecoration: "line-through" }}>₹{product.mrp}</span>}
        </div>
        <button onClick={handleAdd} style={{
          width: "100%", padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13,
          background: added ? COLORS.bark : COLORS.saffron, color: COLORS.white, transition: "background 0.3s",
        }}>
          {added ? "✓ Added" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
 
function PanditCard({ pandit }) {
  return (
    <div style={{
      background: COLORS.white, borderRadius: 16, border: `1px solid ${COLORS.creamDark}`,
      padding: "20px", display: "flex", gap: 16, transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(232,86,10,0.10)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: COLORS.cream, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, flexShrink: 0, border: `2px solid ${COLORS.marigoldLight}` }}>
        {pandit.avatar}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text, marginBottom: 2 }}>{pandit.name}</div>
        <div style={{ fontSize: 12, color: COLORS.textLight, marginBottom: 4 }}>{pandit.exp} · {pandit.city} · {pandit.lang}</div>
        <div style={{ fontSize: 12, color: COLORS.textMid, marginBottom: 8, fontStyle: "italic" }}>{pandit.speciality}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div><StarRating rating={pandit.rating} /><span style={{ fontSize: 11, color: COLORS.textLight, marginLeft: 4 }}>({pandit.reviews})</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>₹{pandit.price.toLocaleString()}</span>
            <button style={{ padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${COLORS.saffron}`, background: "transparent", color: COLORS.saffron, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
              Book
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
 
function Navbar({ cartCount }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100, background: scrolled ? "rgba(255,248,238,0.97)" : COLORS.cream,
      backdropFilter: "blur(12px)", borderBottom: `1px solid ${scrolled ? COLORS.creamDark : "transparent"}`,
      transition: "all 0.3s", padding: "0 24px",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 26 }}>🪔</span>
          <div>
            <div style={{ fontFamily: "'Georgia', serif", fontWeight: 700, fontSize: 18, color: COLORS.saffron, lineHeight: 1 }}>nityasamagri</div>
            <div style={{ fontSize: 10, color: COLORS.textLight, letterSpacing: 1.5, textTransform: "uppercase" }}>Simplifying Your Spiritual Journey</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, maxWidth: 380, margin: "0 32px" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", background: COLORS.white, border: `1.5px solid ${COLORS.creamDark}`, borderRadius: 10, padding: "0 14px", height: 40 }}>
            <span style={{ marginRight: 8, color: COLORS.textLight }}>🔍</span>
            <input placeholder="Search puja items, pandits…" style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: COLORS.text, flex: 1 }} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {["Shop", "Book Pandit", "Packages"].map(item => (
            <span key={item} style={{ fontSize: 13, fontWeight: 500, color: COLORS.textMid, cursor: "pointer", transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = COLORS.saffron}
              onMouseLeave={e => e.target.style.color = COLORS.textMid}
            >{item}</span>
          ))}
          <div style={{ position: "relative", cursor: "pointer" }}>
            <span style={{ fontSize: 22 }}>🛒</span>
            {cartCount > 0 && (
              <div style={{ position: "absolute", top: -6, right: -6, background: COLORS.saffron, color: COLORS.white, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
                {cartCount}
              </div>
            )}
          </div>
          <button style={{ padding: "8px 18px", borderRadius: 10, background: COLORS.saffron, color: COLORS.white, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Login
          </button>
        </div>
      </div>
    </nav>
  );
}
 
function AnnouncementBar() {
  const msgs = ["🚚 Free delivery on orders above ₹499", "🪔 Top-rated Pandits available 7 days a week", "✨ Navratri Special Kits now available", "📦 Same-day dispatch on orders before 2 PM"];
  const [idx, setIdx] = useState(0);
  useEffect(() => { const t = setInterval(() => setIdx(i => (i + 1) % msgs.length), 3000); return () => clearInterval(t); }, []);
  return (
    <div style={{ background: COLORS.saffron, color: COLORS.white, textAlign: "center", padding: "8px 16px", fontSize: 13, fontWeight: 500, letterSpacing: 0.3 }}>
      {msgs[idx]}
    </div>
  );
}
 
export default function StoreFront() {
  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
 
  const addToCart = (product) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };
 
  const filteredProducts = activeTab === "all" ? products : products.filter(p => p.category.toLowerCase().includes(activeTab));
 
  return (
    <div style={{ background: COLORS.cream, minHeight: "100vh", fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif", color: COLORS.text }}>
      <AnnouncementBar />
      <Navbar cartCount={cartCount} />
 
      {/* Hero */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px 40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: COLORS.white, border: `1px solid ${COLORS.creamDark}`, borderRadius: 999, padding: "6px 14px", marginBottom: 20, fontSize: 12, color: COLORS.saffron, fontWeight: 600 }}>
            🪔 India's Trusted Spiritual Marketplace
          </div>
          <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 52, lineHeight: 1.15, color: COLORS.text, margin: "0 0 16px", fontWeight: 700 }}>
            Bringing<br />
            <span style={{ color: COLORS.saffron }}>Divinity</span> to<br />
            Your Doorstep
          </h1>
          <p style={{ fontSize: 16, color: COLORS.textMid, lineHeight: 1.7, marginBottom: 32, maxWidth: 420 }}>
            Order pure puja samagri, book verified Pandits, and get complete puja packages delivered anywhere in India.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button style={{ padding: "14px 28px", borderRadius: 12, background: COLORS.saffron, color: COLORS.white, border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              🛒 Shop Samagri
            </button>
            <button style={{ padding: "14px 28px", borderRadius: 12, background: "transparent", color: COLORS.saffron, border: `2px solid ${COLORS.saffron}`, fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              🙏 Book Pandit
            </button>
          </div>
          <div style={{ display: "flex", gap: 32, marginTop: 36 }}>
            {[["15,000+", "Happy Customers"], ["250+", "Verified Pandits"], ["1,250+", "Products"], ["4.9★", "Avg Rating"]].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.saffron }}>{v}</div>
                <div style={{ fontSize: 11, color: COLORS.textLight }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { icon: "🪔", title: "Pure Puja Samagri", sub: "Temple-grade ingredients", bg: COLORS.creamDark },
            { icon: "🙏", title: "Verified Pandits", sub: "Experienced & certified", bg: "#FFF0E8" },
            { icon: "📦", title: "Fast Delivery", sub: "Same day in select cities", bg: "#EEFFF4" },
            { icon: "🎁", title: "Puja Packages", sub: "Pandit + Samagri bundled", bg: "#F8F0FF" },
          ].map(card => (
            <div key={card.title} style={{ background: card.bg, borderRadius: 16, padding: "24px 20px", cursor: "pointer", transition: "transform 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
              <div style={{ fontSize: 32, marginBottom: 10 }}>{card.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text, marginBottom: 4 }}>{card.title}</div>
              <div style={{ fontSize: 12, color: COLORS.textLight }}>{card.sub}</div>
            </div>
          ))}
        </div>
      </section>
 
      {/* Categories */}
      <section style={{ background: COLORS.white, padding: "48px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 28 }}>
            <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 28, color: COLORS.text, margin: 0 }}>Browse by Category</h2>
            <span style={{ fontSize: 13, color: COLORS.saffron, cursor: "pointer", fontWeight: 600 }}>View all →</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 12 }}>
            {categories.map(cat => (
              <div key={cat.name} style={{ textAlign: "center", cursor: "pointer", padding: "16px 8px", borderRadius: 14, border: `1.5px solid ${COLORS.creamDark}`, background: COLORS.cream, transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.saffron; e.currentTarget.style.background = "#FFF3EC"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.creamDark; e.currentTarget.style.background = COLORS.cream; }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{cat.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.text, lineHeight: 1.3, marginBottom: 4 }}>{cat.name}</div>
                <div style={{ fontSize: 10, color: COLORS.textLight }}>{cat.count} items</div>
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* Festival Campaigns */}
      <section style={{ padding: "48px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 28, color: COLORS.text, margin: "0 0 24px" }}>Festival Collections</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {festivals.map(f => (
            <div key={f.name} style={{ background: f.bg, borderRadius: 16, padding: "24px 20px", cursor: "pointer", border: `1.5px solid transparent`, transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = f.color; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: f.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{f.date}</div>
              <div style={{ fontFamily: "'Georgia', serif", fontSize: 22, fontWeight: 700, color: COLORS.text, marginBottom: 12 }}>{f.name}</div>
              <div style={{ fontSize: 12, color: COLORS.textMid, marginBottom: 16 }}>Special kits, Pandits & complete packages</div>
              <span style={{ fontSize: 12, fontWeight: 700, color: f.color }}>Explore →</span>
            </div>
          ))}
        </div>
      </section>
 
      {/* Products */}
      <section style={{ background: COLORS.white, padding: "48px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 28, color: COLORS.text, margin: 0 }}>Top Selling Products</h2>
            <span style={{ fontSize: 13, color: COLORS.saffron, cursor: "pointer", fontWeight: 600 }}>View all →</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
            {["all", "hawan", "ghee", "phool", "prashad", "festival"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "7px 18px", borderRadius: 999, border: `1.5px solid ${activeTab === tab ? COLORS.saffron : COLORS.creamDark}`,
                background: activeTab === tab ? COLORS.saffron : "transparent",
                color: activeTab === tab ? COLORS.white : COLORS.textMid,
                fontWeight: 600, fontSize: 12, cursor: "pointer", textTransform: "capitalize", transition: "all 0.2s",
              }}>
                {tab === "all" ? "All Products" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            {filteredProducts.map(p => <ProductCard key={p.id} product={p} onAddCart={addToCart} />)}
          </div>
        </div>
      </section>
 
      {/* Pandits */}
      <section style={{ padding: "48px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 28, color: COLORS.text, margin: "0 0 6px" }}>Verified Pandits</h2>
            <p style={{ fontSize: 14, color: COLORS.textLight, margin: 0 }}>Book experienced pandits for every ceremony</p>
          </div>
          <button style={{ padding: "10px 20px", borderRadius: 10, background: COLORS.saffron, color: COLORS.white, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Browse All Pandits
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {pandits.map(p => <PanditCard key={p.id} pandit={p} />)}
        </div>
      </section>
 
      {/* Puja Package Banner */}
      <section style={{ padding: "0 24px 48px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ background: `linear-gradient(135deg, ${COLORS.bark} 0%, ${COLORS.deepRed} 100%)`, borderRadius: 24, padding: "48px 56px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, color: COLORS.marigoldLight, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>🎁 Flagship Feature</div>
            <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 36, color: COLORS.white, margin: "0 0 12px", lineHeight: 1.2 }}>Complete Puja Packages</h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, margin: "0 0 28px", maxWidth: 440, lineHeight: 1.6 }}>
              One booking gets you a verified Pandit + all required samagri delivered to your home. Griha Pravesh, Satyanarayan Katha, Rudrabhishek, and more.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button style={{ padding: "12px 24px", borderRadius: 10, background: COLORS.marigold, color: COLORS.bark, border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Explore Packages →
              </button>
              <button style={{ padding: "12px 24px", borderRadius: 10, background: "transparent", color: COLORS.white, border: "1.5px solid rgba(255,255,255,0.4)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Learn More
              </button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, minWidth: 280 }}>
            {[["🏠", "Griha Pravesh", "₹4,999"], ["🪬", "Satyanarayan Katha", "₹3,499"], ["🔱", "Rudrabhishek", "₹5,999"], ["🙏", "Navgrah Shanti", "₹4,499"]].map(([icon, name, price]) => (
              <div key={name} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
                <div style={{ color: COLORS.white, fontSize: 12, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>{name}</div>
                <div style={{ color: COLORS.marigoldLight, fontSize: 13, fontWeight: 700 }}>{price}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* Trust Badges */}
      <section style={{ background: COLORS.white, padding: "40px 24px", borderTop: `1px solid ${COLORS.creamDark}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
          {[
            { icon: "🛡️", title: "100% Authentic Products", sub: "Temple-grade, sourced ethically" },
            { icon: "🚚", title: "Free Delivery ₹499+", sub: "Pan India, tracked shipments" },
            { icon: "↩️", title: "Easy Returns", sub: "7-day hassle-free returns" },
            { icon: "🔒", title: "Secure Payments", sub: "Razorpay · UPI · COD" },
          ].map(b => (
            <div key={b.title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>{b.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text, marginBottom: 4 }}>{b.title}</div>
                <div style={{ fontSize: 12, color: COLORS.textLight }}>{b.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
 
      {/* Footer */}
      <footer style={{ background: COLORS.bark, color: COLORS.white, padding: "48px 24px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 22 }}>🪔</span>
                <span style={{ fontFamily: "'Georgia', serif", fontSize: 18, fontWeight: 700, color: COLORS.marigoldLight }}>nityasamagri</span>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, maxWidth: 280, marginBottom: 16 }}>
                India's most trusted platform for pure puja samagri and verified Pandits. Bringing divinity to your doorstep since 2024.
              </p>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>📍 Mohali, Punjab · support@nityasamagri.com</div>
            </div>
            {[
              { title: "Shop", links: ["Puja Samagri", "Ghee & Oils", "Hawan Items", "Idols & Books", "Festival Kits"] },
              { title: "Services", links: ["Book Pandit", "Puja Packages", "Online Puja", "Custom Booking", "Corporate Puja"] },
              { title: "Help", links: ["Track Order", "Returns", "Privacy Policy", "Terms", "Contact Us"] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.marigoldLight, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>{col.title}</div>
                {col.links.map(l => (
                  <div key={l} style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 10, cursor: "pointer", transition: "color 0.2s" }}
                    onMouseEnter={e => e.target.style.color = COLORS.marigoldLight}
                    onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.6)"}
                  >{l}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>© 2026 nityasamagri. All rights reserved.</div>
            <div style={{ display: "flex", gap: 16 }}>
              {["UPI", "Razorpay", "COD", "Cards"].map(p => (
                <span key={p} style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: 6 }}>{p}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

