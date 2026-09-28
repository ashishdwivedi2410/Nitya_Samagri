"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/auth";
import { PageShell, ProductGrid, Pagination, normalizeProduct, COLORS, inputStyle } from "../../lib/storefront";

const SORTS = [
  { label: "Newest", sortBy: "createdAt", sortOrder: "desc" },
  { label: "Best selling", sortBy: "sold", sortOrder: "desc" },
  { label: "Price: low to high", sortBy: "price", sortOrder: "asc" },
  { label: "Price: high to low", sortBy: "price", sortOrder: "desc" },
  { label: "Name A–Z", sortBy: "name", sortOrder: "asc" },
];

export default function ShopPage() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStock, setInStock] = useState(false);
  const [sortIdx, setSortIdx] = useState(0);
  const [page, setPage] = useState(1);

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/categories").then(({ ok, body }) => { if (ok) setCategories(body.data.items || []); }).catch(() => {});
  }, []);

  // Debounce the search box so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const s = SORTS[sortIdx];
    const params = new URLSearchParams({ page: String(page), limit: "12", sortBy: s.sortBy, sortOrder: s.sortOrder });
    if (query) params.set("q", query);
    if (categoryId) params.set("categoryId", categoryId);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (inStock) params.set("inStock", "true");

    apiFetch(`/products?${params.toString()}`)
      .then(({ ok, body }) => {
        if (cancelled) return;
        if (!ok) { setError(body.message || "Couldn't load products."); return; }
        setProducts((body.data.products || []).map(normalizeProduct));
        setPagination(body.data.pagination || { page: 1, pages: 1, total: 0 });
      })
      .catch(() => { if (!cancelled) setError("Couldn't reach the server. Please try again."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [query, categoryId, minPrice, maxPrice, inStock, sortIdx, page]);

  const reset = () => {
    setSearch(""); setQuery(""); setCategoryId(""); setMinPrice(""); setMaxPrice(""); setInStock(false); setSortIdx(0); setPage(1);
  };

  return (
    <PageShell>
      <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 32, margin: "0 0 6px" }}>Shop</h1>
      <p style={{ color: COLORS.textLight, fontSize: 14, margin: "0 0 24px" }}>
        {pagination.total} product{pagination.total === 1 ? "" : "s"}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28, alignItems: "center" }}>
        <input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, minWidth: 220, flex: "1 1 220px" }} />
        <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }} style={inputStyle}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name} ({c.productCount})</option>)}
        </select>
        <input type="number" min="0" placeholder="Min ₹" value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setPage(1); }} style={{ ...inputStyle, width: 90 }} />
        <input type="number" min="0" placeholder="Max ₹" value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }} style={{ ...inputStyle, width: 90 }} />
        <label style={{ fontSize: 13, color: COLORS.textMid, display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={inStock} onChange={(e) => { setInStock(e.target.checked); setPage(1); }} /> In stock
        </label>
        <select value={sortIdx} onChange={(e) => { setSortIdx(Number(e.target.value)); setPage(1); }} style={inputStyle}>
          {SORTS.map((s, i) => <option key={s.label} value={i}>{s.label}</option>)}
        </select>
        <button onClick={reset} style={{ ...inputStyle, cursor: "pointer", fontWeight: 600, color: COLORS.saffron }}>Reset</button>
      </div>

      {loading ? (
        <div style={{ padding: "48px 0", textAlign: "center", color: COLORS.textLight, fontSize: 14 }}>Loading products…</div>
      ) : error ? (
        <div style={{ padding: "48px 0", textAlign: "center", color: "#C0392B", fontSize: 14 }}>{error}</div>
      ) : (
        <>
          <ProductGrid products={products} />
          <Pagination page={pagination.page} pages={pagination.pages} onChange={setPage} />
        </>
      )}
    </PageShell>
  );
}