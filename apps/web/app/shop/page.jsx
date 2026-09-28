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

const PRICE_RANGES = [
  { label: "Under ₹250", min: "", max: "250" },
  { label: "₹250 – ₹500", min: "250", max: "500" },
  { label: "₹500 – ₹1000", min: "500", max: "1000" },
  { label: "Over ₹1000", min: "1000", max: "" },
];

function toggle(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function Section({ title, children }) {
  return (
    <div style={{ padding: "18px 0", borderBottom: `1px solid ${COLORS.creamDark}` }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: COLORS.textMid, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function CheckRow({ checked, onChange, label, count, type = "checkbox" }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: COLORS.text, padding: "4px 0", cursor: "pointer" }}>
      <input type={type} checked={checked} onChange={onChange} style={{ accentColor: COLORS.saffron }} />
      <span style={{ flex: 1 }}>{label}</span>
      {count != null && <span style={{ fontSize: 11, color: COLORS.textLight }}>{count}</span>}
    </label>
  );
}

export default function ShopPage() {
  const [categories, setCategories] = useState([]);
  const [facets, setFacets] = useState({ brands: [], sizes: [], price: { min: 0, max: 0 } });

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandIds, setBrandIds] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStock, setInStock] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [sortIdx, setSortIdx] = useState(0);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/categories").then(({ ok, body }) => { if (ok) setCategories(body.data.items || []); }).catch(() => {});
    apiFetch("/products/filters").then(({ ok, body }) => { if (ok) setFacets(body.data); }).catch(() => {});
  }, []);

  // Debounce search so we don't fire a request per keystroke.
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
    if (brandIds.length) params.set("brandId", brandIds.join(","));
    if (sizes.length) params.set("size", sizes.join(","));
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (inStock) params.set("inStock", "true");
    if (onSale) params.set("onSale", "true");

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
  }, [query, categoryId, brandIds, sizes, minPrice, maxPrice, inStock, onSale, sortIdx, page]);

  const change = (setter) => (v) => { setter(v); setPage(1); };
  const clearAll = () => {
    setSearch(""); setQuery(""); setCategoryId(""); setBrandIds([]); setSizes([]);
    setMinPrice(""); setMaxPrice(""); setInStock(false); setOnSale(false); setPage(1);
  };

  // Active-filter chips shown above the grid.
  const chips = [];
  if (categoryId) chips.push({ key: "cat", label: categories.find((c) => c._id === categoryId)?.name || "Category", clear: () => change(setCategoryId)("") });
  brandIds.forEach((id) => chips.push({ key: "b" + id, label: facets.brands.find((b) => b._id === id)?.name || "Brand", clear: () => change(setBrandIds)(brandIds.filter((x) => x !== id)) }));
  sizes.forEach((sz) => chips.push({ key: "s" + sz, label: sz, clear: () => change(setSizes)(sizes.filter((x) => x !== sz)) }));
  if (minPrice || maxPrice) chips.push({ key: "p", label: `₹${minPrice || 0} – ${maxPrice ? "₹" + maxPrice : "any"}`, clear: () => { setMinPrice(""); setMaxPrice(""); setPage(1); } });
  if (inStock) chips.push({ key: "st", label: "In stock", clear: () => change(setInStock)(false) });
  if (onSale) chips.push({ key: "sale", label: "On sale", clear: () => change(setOnSale)(false) });

  const sidebar = (
    <aside>
      <Section title="Category">
        <CheckRow type="radio" checked={categoryId === ""} onChange={() => change(setCategoryId)("")} label="All categories" />
        {categories.map((c) => (
          <CheckRow key={c._id} type="radio" checked={categoryId === c._id} onChange={() => change(setCategoryId)(c._id)} label={c.name} count={c.productCount} />
        ))}
      </Section>

      {facets.brands.length > 0 && (
        <Section title="Brand">
          {facets.brands.map((b) => (
            <CheckRow key={b._id} checked={brandIds.includes(b._id)} onChange={() => change(setBrandIds)(toggle(brandIds, b._id))} label={b.name} count={b.count} />
          ))}
        </Section>
      )}

      {facets.sizes.length > 0 && (
        <Section title="Size / Pack">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {facets.sizes.map((sz) => {
              const on = sizes.includes(sz.label);
              return (
                <button key={sz.label} onClick={() => change(setSizes)(toggle(sizes, sz.label))} style={{
                  padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  border: `1.5px solid ${on ? COLORS.saffron : COLORS.creamDark}`, background: on ? COLORS.saffron : COLORS.white, color: on ? COLORS.white : COLORS.textMid,
                }}>{sz.label}</button>
              );
            })}
          </div>
        </Section>
      )}

      <Section title="Price">
        {PRICE_RANGES.map((r) => (
          <CheckRow key={r.label} type="radio" checked={minPrice === r.min && maxPrice === r.max} onChange={() => { setMinPrice(r.min); setMaxPrice(r.max); setPage(1); }} label={r.label} />
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
          <input type="number" min="0" placeholder="Min" value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setPage(1); }} style={{ ...inputStyle, width: "100%", minWidth: 0 }} />
          <span style={{ color: COLORS.textLight }}>–</span>
          <input type="number" min="0" placeholder="Max" value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }} style={{ ...inputStyle, width: "100%", minWidth: 0 }} />
        </div>
      </Section>

      <Section title="Availability & Offers">
        <CheckRow checked={inStock} onChange={(e) => change(setInStock)(e.target.checked)} label="In stock only" />
        <CheckRow checked={onSale} onChange={(e) => change(setOnSale)(e.target.checked)} label="On sale (discounted)" />
      </Section>

      <button onClick={clearAll} style={{ ...inputStyle, width: "100%", marginTop: 16, cursor: "pointer", fontWeight: 600, color: COLORS.saffron }}>Clear all filters</button>
    </aside>
  );

  return (
    <PageShell>
      <style>{`
        .shop-layout { display: grid; grid-template-columns: 260px 1fr; gap: 32px; align-items: start; }
        .shop-sidebar { position: sticky; top: 84px; max-height: calc(100vh - 100px); overflow-y: auto; background: #fff; border: 1px solid ${COLORS.creamDark}; border-radius: 16px; padding: 4px 18px 18px; }
        .shop-filter-toggle { display: none; }
        @media (max-width: 820px) {
          .shop-layout { grid-template-columns: 1fr; }
          .shop-sidebar { position: static; max-height: none; display: none; }
          .shop-sidebar.open { display: block; }
          .shop-filter-toggle { display: inline-block; }
        }
      `}</style>

      <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 32, margin: "0 0 6px" }}>Shop</h1>
      <p style={{ color: COLORS.textLight, fontSize: 14, margin: "0 0 20px" }}>Everything you need for puja, hawan and festivals.</p>

      <div className="shop-layout">
        <div className={`shop-sidebar${showFilters ? " open" : ""}`}>{sidebar}</div>

        <section>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14, alignItems: "center" }}>
            <input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, flex: "1 1 220px", minWidth: 180 }} />
            <button className="shop-filter-toggle" onClick={() => setShowFilters((v) => !v)} style={{ ...inputStyle, cursor: "pointer", fontWeight: 600 }}>
              {showFilters ? "Hide filters" : `Filters${chips.length ? ` (${chips.length})` : ""}`}
            </button>
            <select value={sortIdx} onChange={(e) => { setSortIdx(Number(e.target.value)); setPage(1); }} style={inputStyle}>
              {SORTS.map((s, i) => <option key={s.label} value={i}>{s.label}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 18 }}>
            <span style={{ fontSize: 13, color: COLORS.textLight }}>{pagination.total} product{pagination.total === 1 ? "" : "s"}</span>
            {chips.map((c) => (
              <button key={c.key} onClick={c.clear} style={{ padding: "4px 10px", borderRadius: 999, border: `1px solid ${COLORS.saffron}`, background: "#FFF3EC", color: COLORS.saffron, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {c.label} ✕
              </button>
            ))}
            {chips.length > 0 && <button onClick={clearAll} style={{ background: "none", border: "none", color: COLORS.textLight, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>Clear all</button>}
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
        </section>
      </div>
    </PageShell>
  );
}