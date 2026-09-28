"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../lib/auth";
import { PageShell, ProductGrid, Pagination, normalizeProduct, COLORS, inputStyle } from "../../../lib/storefront";

const SORTS = [
  { label: "Newest", sortBy: "createdAt", sortOrder: "desc" },
  { label: "Best selling", sortBy: "sold", sortOrder: "desc" },
  { label: "Price: low to high", sortBy: "price", sortOrder: "asc" },
  { label: "Price: high to low", sortBy: "price", sortOrder: "desc" },
];

export default function CategoryPage() {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [sortIdx, setSortIdx] = useState(0);
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setCategory(null); setNotFound(false);
    apiFetch(`/categories/${slug}`)
      .then(({ ok, status, body }) => {
        if (cancelled) return;
        if (ok) setCategory(body.data.category);
        else if (status === 404) setNotFound(true);
        else setError(body.message || "Couldn't load category.");
      })
      .catch(() => { if (!cancelled) setError("Couldn't reach the server. Please try again."); });
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (!category) return;
    let cancelled = false;
    setLoading(true);
    const s = SORTS[sortIdx];
    const params = new URLSearchParams({ page: String(page), limit: "12", categoryId: category._id, sortBy: s.sortBy, sortOrder: s.sortOrder });
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
  }, [category, sortIdx, page]);

  if (notFound) {
    return (
      <PageShell>
        <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 28 }}>Category not found</h1>
        <p style={{ color: COLORS.textLight }}>This category doesn't exist or is no longer available.</p>
        <Link href="/shop" style={{ color: COLORS.saffron, fontWeight: 600 }}>Browse all products →</Link>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div style={{ fontSize: 12, color: COLORS.textLight, marginBottom: 10 }}>
        <Link href="/" style={{ color: COLORS.textLight, textDecoration: "none" }}>Home</Link> /{" "}
        <Link href="/shop" style={{ color: COLORS.textLight, textDecoration: "none" }}>Shop</Link> / {category?.name || "…"}
      </div>
      <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 32, margin: "0 0 6px" }}>{category?.name || "Loading…"}</h1>
      {category?.description && <p style={{ color: COLORS.textMid, fontSize: 14, maxWidth: 640, margin: "0 0 8px" }}>{category.description}</p>}
      <p style={{ color: COLORS.textLight, fontSize: 13, margin: "0 0 20px" }}>{pagination.total} product{pagination.total === 1 ? "" : "s"}</p>

      <div style={{ marginBottom: 24 }}>
        <select value={sortIdx} onChange={(e) => { setSortIdx(Number(e.target.value)); setPage(1); }} style={inputStyle}>
          {SORTS.map((s, i) => <option key={s.label} value={i}>{s.label}</option>)}
        </select>
      </div>

      {error ? (
        <div style={{ padding: "48px 0", textAlign: "center", color: "#C0392B", fontSize: 14 }}>{error}</div>
      ) : loading || !category ? (
        <div style={{ padding: "48px 0", textAlign: "center", color: COLORS.textLight, fontSize: 14 }}>Loading products…</div>
      ) : (
        <>
          <ProductGrid products={products} />
          <Pagination page={pagination.page} pages={pagination.pages} onChange={setPage} />
        </>
      )}
    </PageShell>
  );
}