"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../lib/auth";

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
  red: "#C0392B",
  redBg: "#FFF0EE",
};

// Generic educational copy — not product-specific data, so it's safe to
// show for any product rather than inventing per-product content the
// backend doesn't provide.
const GENERIC_PUJA_USES = [
  { icon: "🔥", title: "Havan & Homa", desc: "Commonly used in fire ceremonies as part of the offerings." },
  { icon: "🪔", title: "Deepak / Diya", desc: "Used to light lamps during daily and festival worship." },
  { icon: "🛁", title: "Abhishek", desc: "Poured over idols during ritual bathing ceremonies." },
  { icon: "🌿", title: "Panchamrit", desc: "Often included among the sacred ingredients in Panchamrit." },
  { icon: "🍚", title: "Prasad", desc: "Used in preparing prasad offered after the ritual." },
];

// Converts the GET /api/v1/products/:slug response (backend/src/modules/
// products/product.routes.ts) into the shape this page renders. Fields the
// backend doesn't store yet (subtitle, brand, images, highlights,
// per-product puja-use copy) fall back to empty/generic values instead of
// being invented, so the UI degrades gracefully rather than lying about
// what's real.
function normalizeProduct(apiProduct, related) {
  const variants = (apiProduct.variants || []).map(v => ({
    id: v._id,
    label: v.label,
    price: v.price,
    mrp: v.mrp,
    stock: v.stock,
  }));
  // Products without configured variants still need one "variant" to drive
  // the price/qty UI — synthesize it from the product's own price/mrp/stock.
  if (variants.length === 0) {
    variants.push({ id: apiProduct._id, label: "Standard", price: apiProduct.price, mrp: apiProduct.mrp, stock: apiProduct.stock });
  }

  const reviews = (apiProduct.reviews || []).map(r => ({
    name: r.userId?.name || "Verified Customer",
    city: "",
    rating: r.rating,
    date: r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "",
    title: r.title || "",
    text: r.comment || "",
    photos: false,
    verified: !!r.isVerifiedPurchase,
  }));
  const avgRating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  const specifications = [
    ["SKU", apiProduct.sku],
    ["Category", apiProduct.categoryId?.name],
    ["HSN Code", apiProduct.hsnCode],
    ["GST", apiProduct.gstPct != null ? `${apiProduct.gstPct}%` : undefined],
    ["Weight", apiProduct.weight ? `${apiProduct.weight} g` : undefined],
  ].filter(([, v]) => v !== undefined && v !== null && v !== "");

  return {
    id: apiProduct._id,
    name: apiProduct.name,
    subtitle: apiProduct.shortDesc || "",
    brand: "",
    category: apiProduct.categoryId?.name || "Puja Samagri",
    sku: apiProduct.sku,
    rating: avgRating,
    reviewCount: apiProduct.reviewCount ?? reviews.length,
    totalSold: apiProduct.sold ?? 0,
    badge: apiProduct.isFeatured ? "Featured" : null,
    images: ["🪔"], // backend Product model has no image field yet
    description: apiProduct.description || apiProduct.shortDesc || "",
    highlights: [],
    variants,
    specifications,
    pujaUses: GENERIC_PUJA_USES,
    reviews,
    crossSell: (related || []).map(p => ({
      id: p._id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      mrp: p.mrp,
      icon: "🪔",
      category: "",
    })),
  };
}

const EMPTY_PRODUCT = normalizeProduct({ variants: [], reviews: [] }, []);

function Stars({ n, size = 14 }) {
  return (
    <span style={{ color: C.marigold, fontSize: size, lineHeight: 1 }}>
      {"★".repeat(Math.floor(n))}
      {n % 1 >= 0.5 ? "½" : ""}
      {"☆".repeat(5 - Math.ceil(n))}
    </span>
  );
}

function RatingBar({ label, pct }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
      <span style={{ fontSize: 12, color: C.textLight, minWidth: 24 }}>{label}★</span>
      <div style={{ flex: 1, height: 6, background: C.creamDark, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: C.marigold, borderRadius: 3, transition: "width 0.6s" }} />
      </div>
      <span style={{ fontSize: 11, color: C.textLight, minWidth: 28, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}

function CrossSellCard({ item, onAdd }) {
  const [added, setAdded] = useState(false);
  const disc = Math.round(((item.mrp - item.price) / item.mrp) * 100);
  return (
    <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "16px", display: "flex", gap: 12, alignItems: "center", transition: "box-shadow 0.2s", cursor: "pointer" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(232,86,10,0.10)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      <div style={{ width: 52, height: 52, background: C.cream, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>{item.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: C.saffron, fontWeight: 600, marginBottom: 2 }}>{item.category}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>₹{item.price}</span>
          <span style={{ fontSize: 11, color: C.textLight, textDecoration: "line-through" }}>₹{item.mrp}</span>
          <span style={{ fontSize: 10, color: C.green, fontWeight: 700 }}>{disc}% off</span>
        </div>
      </div>
      <button onClick={() => { setAdded(true); onAdd(item); setTimeout(() => setAdded(false), 1500); }}
        style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${added ? C.green : C.saffron}`, background: added ? C.greenBg : C.saffronBg, color: added ? C.green : C.saffron, fontWeight: 700, fontSize: 12, cursor: "pointer", flexShrink: 0, transition: "all 0.2s" }}>
        {added ? "✓" : "+ Add"}
      </button>
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();

  const [product, setProduct] = useState(EMPTY_PRODUCT);
  const [selectedVariant, setSelectedVariant] = useState(EMPTY_PRODUCT.variants[0]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    apiFetch(`/products/${slug}`)
      .then(({ ok, status, body }) => {
        if (cancelled) return;
        if (!ok) {
          if (status === 404) setNotFound(true);
          return;
        }
        const normalized = normalizeProduct(body.data.product, body.data.related);
        setProduct(normalized);
        setSelectedVariant(normalized.variants[Math.min(1, normalized.variants.length - 1)]);
      })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [slug]);

  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [activeTab, setActiveTab] = useState("description");
  const [cart, setCart] = useState([]);
  const [addedMain, setAddedMain] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [pincode, setPincode] = useState("");
  const [deliveryMsg, setDeliveryMsg] = useState(null);

  const disc = Math.round(((selectedVariant.mrp - selectedVariant.price) / selectedVariant.mrp) * 100);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const addToCart = (item) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === item.id);
      return ex ? prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...item, qty: 1 }];
    });
  };

  const handleAddMain = () => {
    addToCart({ id: `${product.id}-${selectedVariant.id}`, name: `${product.name} ${selectedVariant.label}`, price: selectedVariant.price, qty });
    setAddedMain(true);
    setTimeout(() => setAddedMain(false), 2000);
  };

  const checkDelivery = () => {
    if (pincode.length === 6) {
      setDeliveryMsg(parseInt(pincode[0]) < 5
        ? "✓ Delivery in 2–3 days · Free shipping on this order"
        : "✓ Delivery in 3–5 days · Free shipping on this order");
    } else {
      setDeliveryMsg("Please enter a valid 6-digit pincode.");
    }
  };

  const TABS = ["description", "specifications", "puja uses", "reviews"];

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.cream, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI','Helvetica Neue',sans-serif", color: C.textLight, fontSize: 14 }}>
        Loading product…
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", background: C.cream, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI','Helvetica Neue',sans-serif", gap: 8 }}>
        <div style={{ fontSize: 40 }}>🔍</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Product not found</div>
        <div style={{ fontSize: 13, color: C.textLight }}>It may have been removed or the link is incorrect.</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif" }}>

      {/* Navbar */}
      <nav style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🪔</span>
            <span style={{ fontFamily: "'Georgia',serif", fontWeight: 700, fontSize: 16, color: C.saffron }}>nityasamagri</span>
          </div>
          <div style={{ display: "flex", gap: 8, fontSize: 12, color: C.textLight }}>
            <span style={{ cursor: "pointer" }}>Home</span>
            <span>›</span>
            <span style={{ cursor: "pointer" }}>{product.category}</span>
            <span>›</span>
            <span style={{ color: C.text, fontWeight: 500 }}>{product.name}</span>
          </div>
          <div style={{ position: "relative", cursor: "pointer" }}>
            <span style={{ fontSize: 22 }}>🛒</span>
            {cartCount > 0 && (
              <div style={{ position: "absolute", top: -6, right: -6, background: C.saffron, color: C.white, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{cartCount}</div>
            )}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, marginBottom: 48 }}>

          {/* LEFT — Images */}
          <div>
            {/* Main image */}
            <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.border}`, height: 420, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 120, marginBottom: 16, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 40% 40%, ${C.saffronBg}, ${C.cream})` }} />
              <span style={{ position: "relative", zIndex: 1, filter: "drop-shadow(0 8px 24px rgba(232,86,10,0.2))", transition: "transform 0.3s" }}>{product.images[activeImg]}</span>
              {product.badge && (
                <div style={{ position: "absolute", top: 16, left: 16, background: C.saffron, color: C.white, fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 999 }}>{product.badge}</div>
              )}
              <button onClick={() => setWishlisted(w => !w)} style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: "50%", border: `1.5px solid ${wishlisted ? C.red : C.border}`, background: wishlisted ? C.redBg : C.white, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {wishlisted ? "❤️" : "🤍"}
              </button>
            </div>
            {/* Thumbnails */}
            <div style={{ display: "flex", gap: 10 }}>
              {product.images.map((img, i) => (
                <div key={i} onClick={() => setActiveImg(i)} style={{ width: 72, height: 72, borderRadius: 12, border: `2px solid ${activeImg === i ? C.saffron : C.border}`, background: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, cursor: "pointer", transition: "border-color 0.2s", flexShrink: 0 }}>
                  {img}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Info */}
          <div>
            {/* Brand + category */}
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: C.saffron, fontWeight: 700, background: C.saffronBg, padding: "3px 10px", borderRadius: 999 }}>{product.category}</span>
              {product.brand && (
                <span style={{ fontSize: 12, color: C.gold, fontWeight: 700, background: C.goldBg, padding: "3px 10px", borderRadius: 999 }}>🏷 {product.brand}</span>
              )}
              <span style={{ fontSize: 12, color: C.green, fontWeight: 700, background: C.greenBg, padding: "3px 10px", borderRadius: 999 }}>✓ FSSAI Certified</span>
            </div>

            <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 32, fontWeight: 700, color: C.text, margin: "0 0 6px", lineHeight: 1.2 }}>{product.name}</h1>
            <p style={{ fontSize: 13, color: C.textLight, margin: "0 0 14px", letterSpacing: 0.3 }}>{product.subtitle}</p>

            {/* Rating */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <Stars n={product.rating} size={16} />
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{product.rating}</span>
              <span style={{ fontSize: 13, color: C.textLight }}>({product.reviewCount.toLocaleString()} reviews)</span>
              <span style={{ fontSize: 12, color: C.textLight }}>· {product.totalSold.toLocaleString()} sold</span>
            </div>

            {/* Price */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20, padding: "16px 20px", background: C.white, borderRadius: 14, border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 36, fontWeight: 700, color: C.text }}>₹{selectedVariant.price}</span>
              <span style={{ fontSize: 18, color: C.textLight, textDecoration: "line-through" }}>₹{selectedVariant.mrp}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.green, background: C.greenBg, padding: "3px 10px", borderRadius: 999 }}>{disc}% off</span>
              <span style={{ fontSize: 12, color: C.textLight, marginLeft: "auto" }}>+ GST (5%) included</span>
            </div>

            {/* Variants */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.textMid, marginBottom: 10 }}>Size / Quantity</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {product.variants.map(v => (
                  <button key={v.id} onClick={() => setSelectedVariant(v)}
                    style={{ padding: "10px 20px", borderRadius: 10, border: `2px solid ${selectedVariant.id === v.id ? C.saffron : C.border}`, background: selectedVariant.id === v.id ? C.saffron : C.white, color: selectedVariant.id === v.id ? C.white : C.text, fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.15s", position: "relative" }}>
                    {v.label}
                    {v.stock <= 15 && <span style={{ display: "block", fontSize: 9, fontWeight: 500, color: selectedVariant.id === v.id ? "rgba(255,255,255,0.8)" : C.red }}>Only {v.stock} left</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Qty + Add to cart */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", border: `1.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden", background: C.white }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 40, height: 48, border: "none", background: "transparent", cursor: "pointer", fontSize: 18, color: C.textMid, fontWeight: 700 }}>−</button>
                <span style={{ width: 40, textAlign: "center", fontSize: 16, fontWeight: 700, color: C.text }}>{qty}</span>
                <button onClick={() => setQty(q => Math.min(selectedVariant.stock, q + 1))} style={{ width: 40, height: 48, border: "none", background: "transparent", cursor: "pointer", fontSize: 18, color: C.textMid, fontWeight: 700 }}>+</button>
              </div>
              <button onClick={handleAddMain} style={{ flex: 1, height: 48, borderRadius: 10, border: "none", background: addedMain ? C.bark : C.saffron, color: C.white, fontWeight: 700, fontSize: 15, cursor: "pointer", transition: "background 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {addedMain ? "✓ Added to Cart" : "🛒 Add to Cart"}
              </button>
              <button style={{ height: 48, paddingInline: 20, borderRadius: 10, border: `2px solid ${C.saffron}`, background: C.white, color: C.saffron, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Buy Now
              </button>
            </div>

            {/* Stock badge */}
            <div style={{ marginBottom: 20 }}>
              {selectedVariant.stock > 20
                ? <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>✓ In Stock · Ready to ship</span>
                : <span style={{ fontSize: 13, color: C.red, fontWeight: 600 }}>⚠ Only {selectedVariant.stock} left in stock</span>
              }
            </div>

            {/* Delivery checker */}
            <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "16px 18px", marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.textMid, marginBottom: 10 }}>🚚 Check Delivery</div>
              <div style={{ display: "flex", gap: 10 }}>
                <input placeholder="Enter pincode" value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  style={{ flex: 1, padding: "9px 14px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text, outline: "none", background: C.cream }} />
                <button onClick={checkDelivery} style={{ padding: "9px 18px", borderRadius: 8, background: C.saffron, color: C.white, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Check</button>
              </div>
              {deliveryMsg && <p style={{ fontSize: 12, marginTop: 10, color: deliveryMsg.startsWith("✓") ? C.green : C.red, fontWeight: 600 }}>{deliveryMsg}</p>}
            </div>

            {/* Trust row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["🛡️", "100% Authentic", "Temple-grade, lab tested"],["↩️", "7-Day Returns", "No questions asked"],["📦", "Fast Delivery", "Ships within 24 hrs"],["🔒", "Secure Payment", "UPI · Cards · COD"]].map(([icon, title, sub]) => (
                <div key={title} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 14px", background: C.cream, borderRadius: 10, border: `1px solid ${C.creamDark}` }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{title}</div>
                    <div style={{ fontSize: 11, color: C.textLight }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", borderBottom: `2px solid ${C.creamDark}`, marginBottom: 0, gap: 0 }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding: "14px 28px", border: "none", background: "transparent", cursor: "pointer", fontSize: 14, fontWeight: activeTab === tab ? 700 : 400, color: activeTab === tab ? C.saffron : C.textLight, borderBottom: `3px solid ${activeTab === tab ? C.saffron : "transparent"}`, marginBottom: -2, textTransform: "capitalize", transition: "all 0.2s", whiteSpace: "nowrap" }}>
                {tab}
              </button>
            ))}
          </div>

          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderTop: "none", borderRadius: "0 0 16px 16px", padding: "32px" }}>

            {/* Description tab */}
            {activeTab === "description" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
                <div>
                  <h3 style={{ fontFamily: "'Georgia',serif", fontSize: 20, color: C.text, margin: "0 0 14px" }}>About This Product</h3>
                  <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.8, marginBottom: 24 }}>{product.description}</p>
                  <h3 style={{ fontFamily: "'Georgia',serif", fontSize: 18, color: C.text, margin: "0 0 14px" }}>Key Highlights</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {product.highlights.map(h => (
                      <div key={h} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, color: C.textMid }}>
                        <span style={{ color: C.saffron, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✦</span>
                        {h}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 style={{ fontFamily: "'Georgia',serif", fontSize: 18, color: C.text, margin: "0 0 14px" }}>SKU & Details</h3>
                  <div style={{ background: C.cream, borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
                    {[["SKU", product.sku],["Brand", product.brand],["Category", product.category]].filter(([, v]) => !!v).map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13 }}>
                        <span style={{ color: C.textLight }}>{k}</span>
                        <span style={{ fontWeight: 600, color: C.text }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: `linear-gradient(135deg, ${C.bark}, ${C.barkLight})`, borderRadius: 14, padding: "20px 22px", color: C.white }}>
                    <div style={{ fontSize: 13, color: C.marigoldLight, fontWeight: 600, marginBottom: 8 }}>🙏 Why This Matters for Puja</div>
                    <p style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.85)", margin: 0 }}>
                      Pure A2 ghee is prescribed in Ayurveda and Vedic scriptures for all fire rituals. Using adulterated ghee in havan reduces the efficacy of the ceremony. This ghee meets the standards recommended by temple pandits across India.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Specifications tab */}
            {activeTab === "specifications" && (
              <div style={{ maxWidth: 640 }}>
                <h3 style={{ fontFamily: "'Georgia',serif", fontSize: 20, color: C.text, margin: "0 0 20px" }}>Product Specifications</h3>
                <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }}>
                  {product.specifications.map(([k, v], i) => (
                    <div key={k} style={{ display: "flex", background: i % 2 === 0 ? C.cream : C.white, padding: "13px 18px", borderBottom: i < product.specifications.length - 1 ? `1px solid ${C.border}` : "none" }}>
                      <span style={{ fontSize: 13, color: C.textLight, minWidth: 180, fontWeight: 500 }}>{k}</span>
                      <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Puja uses tab */}
            {activeTab === "puja uses" && (
              <div>
                <h3 style={{ fontFamily: "'Georgia',serif", fontSize: 20, color: C.text, margin: "0 0 6px" }}>How to Use in Puja & Rituals</h3>
                <p style={{ fontSize: 14, color: C.textLight, margin: "0 0 24px" }}>Pure cow ghee has been integral to Hindu rituals for thousands of years.</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                  {product.pujaUses.map(u => (
                    <div key={u.title} style={{ background: C.cream, borderRadius: 14, padding: "24px 20px", border: `1px solid ${C.creamDark}` }}>
                      <div style={{ fontSize: 36, marginBottom: 12 }}>{u.icon}</div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 8 }}>{u.title}</div>
                      <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>{u.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews tab */}
            {activeTab === "reviews" && (
              <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 40 }}>
                {/* Rating summary */}
                <div>
                  <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <div style={{ fontSize: 56, fontWeight: 700, color: C.text, lineHeight: 1 }}>{product.rating}</div>
                    <Stars n={product.rating} size={20} />
                    <div style={{ fontSize: 13, color: C.textLight, marginTop: 6 }}>{product.reviewCount.toLocaleString()} reviews</div>
                  </div>
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = product.reviews.filter(r => Math.round(r.rating) === star).length;
                    const pct = product.reviews.length ? Math.round((count / product.reviews.length) * 100) : 0;
                    return <RatingBar key={star} label={String(star)} pct={pct} />;
                  })}
                </div>
                {/* Review cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {product.reviews.map((r, i) => (
                    <div key={i} style={{ background: C.cream, borderRadius: 14, padding: "20px 22px", border: `1px solid ${C.creamDark}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{r.name}</span>
                            <span style={{ fontSize: 11, color: C.textLight }}>· {r.city}</span>
                            {r.verified && <span style={{ fontSize: 10, color: C.green, fontWeight: 700, background: C.greenBg, padding: "2px 7px", borderRadius: 999 }}>✓ Verified Purchase</span>}
                          </div>
                          <Stars n={r.rating} />
                        </div>
                        <span style={{ fontSize: 12, color: C.textLight }}>{r.date}</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 6 }}>{r.title}</div>
                      <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.7, margin: 0 }}>{r.text}</p>
                      {r.photos && <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                        {[1, 2].map(n => <div key={n} style={{ width: 56, height: 56, borderRadius: 8, background: C.creamDark, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, cursor: "pointer" }}>📷</div>)}
                      </div>}
                    </div>
                  ))}
                  <button style={{ padding: "12px 0", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.white, color: C.textMid, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                    Load more reviews →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Frequently bought together */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: "'Georgia',serif", fontSize: 24, color: C.text, margin: "0 0 8px" }}>Frequently Bought Together</h2>
          <p style={{ fontSize: 14, color: C.textLight, margin: "0 0 20px" }}>Customers who bought this also bought:</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
            {product.crossSell.map(item => <CrossSellCard key={item.id} item={item} onAdd={addToCart} />)}
          </div>
          <div style={{ marginTop: 16, background: C.goldBg, border: `1px solid ${C.marigold}44`, borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, color: C.textMid }}>
              <span style={{ fontWeight: 700, color: C.gold }}>💡 Complete Puja Bundle:</span> Add all 4 items and save ₹120 with coupon <strong>BUNDLE120</strong>
            </div>
            <button style={{ padding: "9px 20px", borderRadius: 8, background: C.marigold, color: C.bark, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0 }}>
              Add All 4 Items
            </button>
          </div>
        </div>
      </div>

      {/* Sticky bottom bar (mobile-style) */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.white, borderTop: `1px solid ${C.border}`, padding: "12px 24px", display: "flex", gap: 12, alignItems: "center", zIndex: 40, boxShadow: "0 -4px 24px rgba(0,0,0,0.06)" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: C.textLight }}>Selected: {selectedVariant.label}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>₹{selectedVariant.price} <span style={{ fontSize: 13, color: C.textLight, fontWeight: 400, textDecoration: "line-through" }}>₹{selectedVariant.mrp}</span></div>
        </div>
        <button onClick={handleAddMain} style={{ padding: "12px 28px", borderRadius: 10, border: `2px solid ${C.saffron}`, background: C.white, color: C.saffron, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          🛒 Add to Cart
        </button>
        <button style={{ padding: "12px 28px", borderRadius: 10, border: "none", background: C.saffron, color: C.white, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          Buy Now
        </button>
      </div>

      {/* Spacer for sticky bar */}
      <div style={{ height: 80 }} />
    </div>
  );
}