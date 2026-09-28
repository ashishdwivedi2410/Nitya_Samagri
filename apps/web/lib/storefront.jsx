"use client";

// Shared building blocks for the /shop, /category/[slug], /festival and
// /festival/[slug] pages. Styling mirrors the homepage (inline styles, same
// palette) so the storefront looks consistent.

import { useState } from "react";
import Link from "next/link";
import { useCartStore } from "./cartStore";

export const COLORS = {
  saffron: "#E8560A",
  marigold: "#F5A623",
  marigoldLight: "#FAC65A",
  deepRed: "#8B1A1A",
  cream: "#FFF8EE",
  creamDark: "#F5ECD8",
  bark: "#5C3317",
  text: "#2C1A0E",
  textMid: "#5C3D20",
  textLight: "#9A7050",
  white: "#FFFFFF",
};

// Same mapping the homepage uses for GET /api/v1/products items.
export function normalizeProduct(p) {
  return {
    id: p._id,
    slug: p.slug,
    name: p.name,
    category: p.categoryId?.name || "Puja Samagri",
    price: p.price,
    mrp: p.mrp,
    img: "🪔",
    badge: p.isFeatured ? "Featured" : null,
  };
}

export function useAddToCart() {
  const addCartItem = useCartStore((s) => s.addItem);
  return (product) =>
    addCartItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      mrp: product.mrp,
      icon: product.img,
      category: product.category,
    });
}

export function StoreHeader() {
  const items = useCartStore((s) => s.items);
  const cartCount = items.reduce((s, i) => s + i.qty, 0);
  return (
    <header style={{ background: COLORS.white, borderBottom: `1px solid ${COLORS.creamDark}`, position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ fontSize: 24 }}>🪔</span>
          <span style={{ fontFamily: "'Georgia', serif", fontSize: 20, fontWeight: 700, color: COLORS.saffron }}>nityasamagri</span>
        </Link>
        <nav style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {[["Shop", "/shop"], ["Festivals", "/festival"]].map(([label, href]) => (
            <Link key={label} href={href} style={{ fontSize: 13, fontWeight: 500, color: COLORS.textMid, textDecoration: "none" }}>{label}</Link>
          ))}
          <Link href="/cart" style={{ fontSize: 13, fontWeight: 600, color: COLORS.saffron, textDecoration: "none" }}>
            🛒 Cart{cartCount > 0 ? ` (${cartCount})` : ""}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function PageShell({ children }) {
  return (
    <div style={{ background: COLORS.cream, minHeight: "100vh", fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif", color: COLORS.text }}>
      <StoreHeader />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 64px" }}>{children}</main>
    </div>
  );
}

export function ProductCard({ product, onAddCart }) {
  const [added, setAdded] = useState(false);
  const disc = product.mrp > 0 ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const handleAdd = () => { setAdded(true); onAddCart(product); setTimeout(() => setAdded(false), 1500); };
  return (
    <div style={{ background: COLORS.white, borderRadius: 16, overflow: "hidden", border: `1px solid ${COLORS.creamDark}`, position: "relative" }}>
      {product.badge && (
        <div style={{ position: "absolute", top: 12, left: 12, background: COLORS.saffron, color: COLORS.white, fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 999 }}>{product.badge}</div>
      )}
      {disc > 0 && (
        <div style={{ position: "absolute", top: 12, right: 12, background: COLORS.deepRed, color: COLORS.white, fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 999 }}>{disc}% OFF</div>
      )}
      <Link href={`/product/${product.slug}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
        <div style={{ background: COLORS.cream, height: 140, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56 }}>{product.img}</div>
        <div style={{ padding: "14px 16px 0" }}>
          <div style={{ fontSize: 11, color: COLORS.saffron, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>{product.category}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 6, lineHeight: 1.3 }}>{product.name}</div>
        </div>
      </Link>
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>₹{product.price}</span>
          {disc > 0 && <span style={{ fontSize: 13, color: COLORS.textLight, textDecoration: "line-through" }}>₹{product.mrp}</span>}
        </div>
        <button onClick={handleAdd} style={{ width: "100%", padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, background: added ? COLORS.bark : COLORS.saffron, color: COLORS.white }}>
          {added ? "✓ Added" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

export function ProductGrid({ products }) {
  const addToCart = useAddToCart();
  if (products.length === 0) {
    return <div style={{ padding: "48px 0", textAlign: "center", color: COLORS.textLight, fontSize: 14 }}>No products found.</div>;
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 20 }}>
      {products.map((p) => <ProductCard key={p.id} product={p} onAddCart={addToCart} />)}
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const btn = (disabled) => ({
    padding: "8px 16px", borderRadius: 10, border: `1.5px solid ${COLORS.creamDark}`, background: COLORS.white,
    color: COLORS.textMid, fontWeight: 600, fontSize: 13, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
  });
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 32 }}>
      <button style={btn(page <= 1)} disabled={page <= 1} onClick={() => onChange(page - 1)}>← Prev</button>
      <span style={{ fontSize: 13, color: COLORS.textMid }}>Page {page} of {pages}</span>
      <button style={btn(page >= pages)} disabled={page >= pages} onClick={() => onChange(page + 1)}>Next →</button>
    </div>
  );
}

export const inputStyle = {
  padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${COLORS.creamDark}`, background: COLORS.white,
  fontSize: 13, color: COLORS.text, outline: "none",
};