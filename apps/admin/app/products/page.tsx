"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import RequireAuth from "../_components/RequireAuth";
import { api } from "../_lib/api";

// ─── THEME (matches coupons/store pages) ───────────────────────────────────
const C = {
  sb: "#0F0B07", sbBorder: "#2A1E0E", sbText: "#C8A870", sbDim: "#5A4030", sbAccent: "#E8560A",
  bg: "#FAF7F2", bgCard: "#FFFFFF", bgHover: "#F5F0E8", border: "#E8DDD0",
  saffron: "#E8560A", saffronBg: "#FFF3EC",
  marigold: "#F5A623", marigoldBg: "#FFFBE8",
  text: "#1A1208", textMid: "#5C4030", textLight: "#9A8070",
  green: "#1A7A3C", greenBg: "#EDFAF3",
  red: "#C0392B", redBg: "#FFF0EE",
  blue: "#1A5C9E", blueBg: "#EEF4FF",
  purple: "#6B2EA8",
  white: "#FFFFFF",
};

// ─── DATA HELPERS ───────────────────────────────────────────────────────────
function productsFetcher(url: string) {
  return api.get<{ data: { products: any[]; pagination: any; stats: any } }>(url).then(r => r.data);
}
const catFetcher = (url: string) => api.get<{ data: { items: any[] } }>(url).then(r => r.data.items);

const EMPTY_FORM = {
  name: "", slug: "", categoryId: "", brandId: "", description: "", shortDesc: "",
  mrp: "", price: "", costPrice: "", gstPct: "5", hsnCode: "", sku: "", stock: "0",
  lowStockAt: "10", weight: "", tags: "", isFeatured: false, status: "draft",
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ─── SMALL UI PRIMITIVES ────────────────────────────────────────────────────
function Card({ children, style = {} }: any) {
  return <div style={{ background: C.bgCard, borderRadius: 14, border: `1px solid ${C.border}`, ...style }}>{children}</div>;
}
function Input({ label, type = "text", value, onChange, placeholder, prefix, suffix, helper }: any) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMid, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {prefix && <span style={{ position: "absolute", left: 12, fontSize: 13, color: C.textLight }}>{prefix}</span>}
        <input type={type} value={value} onChange={onChange} placeholder={placeholder}
          style={{ width: "100%", boxSizing: "border-box", padding: `10px ${suffix ? "36px" : "12px"} 10px ${prefix ? "28px" : "12px"}`, borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text, background: C.bgHover, outline: "none", fontFamily: "inherit" }} />
        {suffix && <span style={{ position: "absolute", right: 12, fontSize: 12, color: C.textLight }}>{suffix}</span>}
      </div>
      {helper && <p style={{ fontSize: 11, color: C.textLight, margin: "4px 0 0" }}>{helper}</p>}
    </div>
  );
}
function Toggle({ on, onChange }: any) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: 40, height: 22, borderRadius: 11, background: on ? C.saffron : C.border, position: "relative", cursor: "pointer", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 2, left: on ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: C.white, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
    </div>
  );
}
function StatusBadge({ status }: { status: string }) {
  const map: any = {
    active: { bg: C.greenBg, color: C.green, label: "● Active" },
    draft: { bg: C.bgHover, color: C.textLight, label: "◐ Draft" },
    archived: { bg: C.redBg, color: C.red, label: "✕ Archived" },
  };
  const s = map[status] || map.draft;
  return <span style={{ background: s.bg, color: s.color, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 999 }}>{s.label}</span>;
}
function StockBadge({ stock, lowStockAt }: { stock: number; lowStockAt: number }) {
  let bg = C.greenBg, color = C.green, label = `${stock} in stock`;
  if (stock === 0) { bg = C.redBg; color = C.red; label = "Out of stock"; }
  else if (stock <= lowStockAt) { bg = C.marigoldBg; color = "#B8790A"; label = `Low · ${stock} left`; }
  return <span style={{ background: bg, color, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 999 }}>{label}</span>;
}

// ─── CATEGORY / BRAND PICKER WITH INLINE "+ NEW" ───────────────────────────
function PickerWithCreate({ label, value, onChange, items, onCreate, placeholder }: any) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const submit = async () => {
    if (!newName.trim()) return;
    const created = await onCreate(newName.trim());
    onChange(created._id);
    setNewName(""); setCreating(false);
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMid, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
      {!creating ? (
        <div style={{ display: "flex", gap: 8 }}>
          <select value={value} onChange={e => onChange(e.target.value)}
            style={{ flex: 1, padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text, background: C.bgHover, outline: "none" }}>
            <option value="">{placeholder}</option>
            {items.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <button onClick={() => setCreating(true)} style={{ padding: "0 14px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.bgHover, color: C.textMid, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>+ New</button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder={`New ${label.toLowerCase()} name`} autoFocus
            style={{ flex: 1, padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.saffron}`, fontSize: 13, color: C.text, background: C.saffronBg, outline: "none" }} />
          <button onClick={submit} style={{ padding: "0 14px", borderRadius: 9, border: "none", background: C.saffron, color: C.white, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Add</button>
          <button onClick={() => setCreating(false)} style={{ padding: "0 12px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.white, color: C.textMid, fontSize: 12, cursor: "pointer" }}>✕</button>
        </div>
      )}
    </div>
  );
}

// ─── PRODUCT FORM ───────────────────────────────────────────────────────────
function ProductForm({ initial, categories, brands, onSave, onCancel, onCreateCategory, onCreateBrand, error }: any) {
  const [form, setForm] = useState<any>(initial || EMPTY_FORM);
  const [autoSlug, setAutoSlug] = useState(!initial);
  const [touched, setTouched] = useState(false);
  const missing: string[] = [];
  if (!form.name?.trim()) missing.push("Product Name");
  if (!form.categoryId) missing.push("Category");
  if (!form.sku?.trim()) missing.push("SKU");
  if (!form.mrp) missing.push("MRP");
  if (!form.price) missing.push("Selling Price");
  const upd = (k: string) => (e: any) => {
    const val = e?.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e;
    setForm((f: any) => {
      const next = { ...f, [k]: val };
      if (k === "name" && autoSlug) next.slug = slugify(val);
      return next;
    });
  };

  return (
    <Card style={{ padding: 24, border: `1px solid ${C.saffron}33`, background: `${C.saffron}05` }}>
      <div style={{ fontFamily: "'Georgia',serif", fontSize: 18, color: C.text, marginBottom: 20 }}>
        {initial?._id ? "Edit Product" : "Add New Product"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <Input label="Product Name *" value={form.name} onChange={upd("name")} placeholder="e.g. Pure Cow Ghee 500ml" />
          <Input label="Slug" value={form.slug} onChange={e => { setAutoSlug(false); upd("slug")(e); }} placeholder="pure-cow-ghee-500ml" helper="Auto-generated from name; edit if you need a custom URL" />
          <PickerWithCreate label="Category *" value={form.categoryId} onChange={upd("categoryId")} items={categories} onCreate={onCreateCategory} placeholder="Select category…" />
          {categories.length === 0 && <p style={{ fontSize: 11, color: "#B8790A", margin: "-10px 0 14px" }}>⚠️ No categories exist yet — click "+ New" above to create one before saving.</p>}
          <PickerWithCreate label="Brand (optional)" value={form.brandId} onChange={upd("brandId")} items={brands} onCreate={onCreateBrand} placeholder="Select brand…" />
          <Input label="SKU *" value={form.sku} onChange={upd("sku")} placeholder="e.g. GHEE-500-001" />
          <Input label="Tags (comma separated)" value={form.tags} onChange={upd("tags")} placeholder="ghee, puja, pure" />
        </div>
        <div>
          <div style={{ display: "flex", gap: 10 }}>
            <Input label="MRP (₹) *" type="number" value={form.mrp} onChange={upd("mrp")} prefix="₹" />
            <Input label="Selling Price (₹) *" type="number" value={form.price} onChange={upd("price")} prefix="₹" />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Input label="Cost Price (₹)" type="number" value={form.costPrice} onChange={upd("costPrice")} prefix="₹" helper="Internal only" />
            <Input label="GST %" type="number" value={form.gstPct} onChange={upd("gstPct")} suffix="%" />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Input label="Stock" type="number" value={form.stock} onChange={upd("stock")} />
            <Input label="Low Stock Alert At" type="number" value={form.lowStockAt} onChange={upd("lowStockAt")} helper="Flags as low stock at/below this" />
          </div>
          <Input label="HSN Code" value={form.hsnCode} onChange={upd("hsnCode")} placeholder="e.g. 1517" />
          <Input label="Weight (grams)" type="number" value={form.weight} onChange={upd("weight")} />
        </div>
      </div>

      <Input label="Short Description" value={form.shortDesc} onChange={upd("shortDesc")} placeholder="Shown on product cards" />
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMid, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Full Description</label>
        <textarea value={form.description} onChange={upd("description")} rows={3}
          style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text, background: C.bgHover, outline: "none", fontFamily: "inherit", resize: "vertical" }} />
      </div>

      <div style={{ display: "flex", gap: 24, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textMid, marginBottom: 6, textTransform: "uppercase" }}>Status</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[["draft", "Draft"], ["active", "Visible / Active"], ["archived", "Hidden / Archived"]].map(([k, l]) => (
              <button key={k} onClick={() => setForm((f: any) => ({ ...f, status: k }))}
                style={{ padding: "8px 14px", borderRadius: 9, border: `1.5px solid ${form.status === k ? C.saffron : C.border}`, background: form.status === k ? C.saffron : "transparent", color: form.status === k ? C.white : C.textMid, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Featured</div>
            <div style={{ fontSize: 11, color: C.textLight }}>Show on homepage</div>
          </div>
          <Toggle on={form.isFeatured} onChange={(v: boolean) => setForm((f: any) => ({ ...f, isFeatured: v }))} />
        </div>
      </div>

      {error && (
        <div style={{ background: C.redBg, color: C.red, border: `1px solid ${C.red}33`, borderRadius: 9, padding: "10px 14px", fontSize: 12, fontWeight: 600, marginBottom: 14 }}>⚠️ {error}</div>
      )}
      {touched && missing.length > 0 && (
        <div style={{ background: C.marigoldBg, color: "#B8790A", border: "1px solid #B8790A33", borderRadius: 9, padding: "10px 14px", fontSize: 12, fontWeight: 600, marginBottom: 14 }}>
          Please fill in: {missing.join(", ")}
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => { setTouched(true); if (missing.length === 0) onSave(form); }} style={{ flex: 1, padding: 12, borderRadius: 11, border: "none", background: C.saffron, color: C.white, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          {initial?._id ? "💾 Save Changes" : "✨ Create Product"}
        </button>
        <button onClick={onCancel} style={{ padding: "12px 20px", borderRadius: 11, border: `1.5px solid ${C.border}`, background: C.white, color: C.textMid, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancel</button>
      </div>
    </Card>
  );
}

// ─── PRODUCT ROW ─────────────────────────────────────────────────────────────
function ProductRow({ p, onEdit, onHide, onShow, onArchive, onRestore }: any) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1fr 1fr 1fr 1.6fr", gap: 12, alignItems: "center", padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{p.name}{p.isFeatured && <span title="Featured" style={{ marginLeft: 6 }}>⭐</span>}</div>
        <div style={{ fontSize: 11, color: C.textLight, fontFamily: "'Courier New',monospace" }}>{p.sku}</div>
      </div>
      <div style={{ fontSize: 12, color: C.textMid }}>{p.categoryId?.name || "—"}</div>
      <div style={{ fontSize: 13 }}>
        <span style={{ fontWeight: 700, color: C.text }}>₹{p.price}</span>
        {p.mrp > p.price && <span style={{ marginLeft: 6, fontSize: 11, color: C.textLight, textDecoration: "line-through" }}>₹{p.mrp}</span>}
      </div>
      <div><StockBadge stock={p.stock} lowStockAt={p.lowStockAt} /></div>
      <div><StatusBadge status={p.status} /></div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <button onClick={() => onEdit(p)} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bgHover, color: C.textMid, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>✏️ Edit</button>
        {p.status === "active" && <button onClick={() => onHide(p)} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bgHover, color: C.textMid, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>🙈 Hide</button>}
        {p.status === "draft" && <button onClick={() => onShow(p)} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.green}33`, background: C.greenBg, color: C.green, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>👁️ Publish</button>}
        {p.status !== "archived"
          ? <button onClick={() => onArchive(p)} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.red}22`, background: C.redBg, color: C.red, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>🗑️ Archive</button>
          : <button onClick={() => onRestore(p)} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.blue}22`, background: C.blueBg, color: C.blue, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>↩️ Restore</button>}
      </div>
    </div>
  );
}

// ─── MAIN VIEW ───────────────────────────────────────────────────────────────
function AdminProducts() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const qs = new URLSearchParams({ status: tab, page: String(page), limit: "20", ...(search ? { q: search } : {}), ...(categoryId ? { categoryId } : {}) }).toString();
  const { data, mutate, isLoading } = useSWR(`/api/v1/products/admin/all?${qs}`, productsFetcher);
  const { data: categories, mutate: mutateCats } = useSWR("/api/v1/categories", catFetcher, { fallbackData: [] });
  const { data: brands, mutate: mutateBrands } = useSWR("/api/v1/brands", catFetcher, { fallbackData: [] });

  const products = data?.products || [];
  const stats = data?.stats || { total: 0, byStatus: { active: 0, draft: 0, archived: 0 }, lowStockCount: 0, outOfStockCount: 0 };
  const pagination = data?.pagination || { pages: 1 };

  const createCategory = async (name: string) => {
    try {
      const res = await api.post<{ data: { category: any } }>("/api/v1/categories", { name });
      mutateCats();
      return res.data.category;
    } catch (e: any) {
      setFormError(e?.message || "Couldn't create category");
      throw e;
    }
  };
  const createBrand = async (name: string) => {
    try {
      const res = await api.post<{ data: { brand: any } }>("/api/v1/brands", { name });
      mutateBrands();
      return res.data.brand;
    } catch (e: any) {
      setFormError(e?.message || "Couldn't create brand");
      throw e;
    }
  };

  const buildPayload = (form: any) => ({
    name: form.name, slug: form.slug || undefined, description: form.description || undefined,
    shortDesc: form.shortDesc || undefined, categoryId: form.categoryId, brandId: form.brandId || undefined,
    mrp: Number(form.mrp), price: Number(form.price), costPrice: form.costPrice ? Number(form.costPrice) : undefined,
    gstPct: Number(form.gstPct) || 5, hsnCode: form.hsnCode || undefined, sku: form.sku,
    stock: Number(form.stock) || 0, lowStockAt: Number(form.lowStockAt) || 10, weight: form.weight ? Number(form.weight) : undefined,
    tags: typeof form.tags === "string" ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : form.tags,
    isFeatured: !!form.isFeatured, status: form.status,
  });

  const save = async (form: any) => {
    setFormError(null);
    const payload = buildPayload(form);
    try {
      if (editing?._id) await api.patch(`/api/v1/products/${editing._id}`, payload);
      else await api.post("/api/v1/products", payload);
      mutate(); setShowForm(false); setEditing(null);
    } catch (e: any) {
      setFormError(e?.message || "Couldn't save this product. Please check the fields and try again.");
    }
  };
  const setStatus = async (p: any, status: string) => { try { await api.patch(`/api/v1/products/${p._id}`, { status }); mutate(); } catch (e: any) { alert(e?.message || "Couldn't update status"); } };
  const archive = async (p: any) => { try { await api.delete(`/api/v1/products/${p._id}`); mutate(); } catch (e: any) { alert(e?.message || "Couldn't archive product"); } };

  const STAT_CARDS = [
    { label: "Total Products", value: stats.total, icon: "📦", color: C.saffron },
    { label: "Active", value: stats.byStatus.active || 0, icon: "✅", color: C.green },
    { label: "Draft", value: stats.byStatus.draft || 0, icon: "◐", color: C.textMid },
    { label: "Archived", value: stats.byStatus.archived || 0, icon: "🗄️", color: C.red },
    { label: "Low Stock", value: stats.lowStockCount, icon: "⚠️", color: "#B8790A" },
    { label: "Out of Stock", value: stats.outOfStockCount, icon: "🚫", color: C.red },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12, marginBottom: 24 }}>
        {STAT_CARDS.map(s => (
          <Card key={s.label} style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: C.textLight }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {(showForm || editing) && (
        <div style={{ marginBottom: 24 }}>
          <ProductForm initial={editing} categories={categories} brands={brands} error={formError}
            onSave={save} onCancel={() => { setShowForm(false); setEditing(null); setFormError(null); }}
            onCreateCategory={createCategory} onCreateBrand={createBrand} />
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="🔍 Search name, description, tags…"
          style={{ flex: 1, minWidth: 220, padding: "9px 14px", borderRadius: 9, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, background: C.bgCard, outline: "none" }} />
        <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setPage(1); }}
          style={{ padding: "9px 12px", borderRadius: 9, border: `1px solid ${C.border}`, fontSize: 12, color: C.textMid, background: C.bgCard }}>
          <option value="">All Categories</option>
          {(categories || []).map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <div style={{ display: "flex", gap: 6 }}>
          {[["all", "All"], ["active", "Active"], ["draft", "Draft"], ["archived", "Archived"]].map(([k, l]) => (
            <button key={k} onClick={() => { setTab(k); setPage(1); }} style={{ padding: "8px 14px", borderRadius: 999, border: `1.5px solid ${tab === k ? C.saffron : C.border}`, background: tab === k ? C.saffron : "transparent", color: tab === k ? C.white : C.textMid, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>{l}</button>
          ))}
        </div>
        {!showForm && !editing && <button onClick={() => { setFormError(null); setShowForm(true); }} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: C.saffron, color: C.white, fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>+ Add Product</button>}
      </div>

      <Card style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1fr 1fr 1fr 1.6fr", gap: 12, padding: "12px 18px", background: C.bgHover, fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: 0.5 }}>
          <div>Product</div><div>Category</div><div>Price</div><div>Stock</div><div>Status</div><div style={{ textAlign: "right" }}>Actions</div>
        </div>
        {isLoading && <div style={{ padding: 32, textAlign: "center", color: C.textLight, fontSize: 13 }}>Loading products…</div>}
        {!isLoading && products.length === 0 && <div style={{ padding: 32, textAlign: "center", color: C.textLight, fontSize: 13 }}>No products match your filters.</div>}
        {products.map((p: any) => (
          <ProductRow key={p._id} p={p}
            onEdit={(prod: any) => { setFormError(null); setEditing({ ...prod, categoryId: prod.categoryId?._id || prod.categoryId, brandId: prod.brandId?._id || prod.brandId, tags: (prod.tags || []).join(", ") }); setShowForm(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            onHide={(prod: any) => setStatus(prod, "draft")} onShow={(prod: any) => setStatus(prod, "active")}
            onArchive={archive} onRestore={(prod: any) => setStatus(prod, "active")} />
        ))}
      </Card>

      {pagination.pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bgCard, color: C.textMid, fontSize: 12, cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.5 : 1 }}>← Prev</button>
          <span style={{ fontSize: 12, color: C.textLight, alignSelf: "center" }}>Page {page} of {pagination.pages}</span>
          <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bgCard, color: C.textMid, fontSize: 12, cursor: page >= pagination.pages ? "not-allowed" : "pointer", opacity: page >= pagination.pages ? 0.5 : 1 }}>Next →</button>
        </div>
      )}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function ProductsModule() {
  const router = useRouter();
  return (
    <RequireAuth>
      <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Segoe UI','Helvetica Neue',sans-serif", background: C.bg }}>
        <div style={{ width: 220, flexShrink: 0, background: C.sb, borderRight: `1px solid ${C.sbBorder}`, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
          <div style={{ padding: "20px 18px 16px", borderBottom: `1px solid ${C.sbBorder}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>🏷️</span>
              <div>
                <div style={{ fontFamily: "'Georgia',serif", fontWeight: 700, fontSize: 14, color: C.sbAccent }}>Products</div>
                <div style={{ fontSize: 9, color: C.sbDim, letterSpacing: 1.4, textTransform: "uppercase" }}>Catalog</div>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, padding: "12px 10px" }}>
            {[["/dashboard", "📊", "Dashboard"], ["/products", "🏷️", "Products"], ["/inventory", "🏭", "Inventory"], ["/coupons", "🎟️", "Coupons"], ["/store", "🎨", "Store Management"], ["/team", "👥", "Team & Roles"]].map(([href, icon, label]) => (
              <button key={href as string} onClick={() => router.push(href as string)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderRadius: 9, border: "none", background: href === "/products" ? `${C.sbAccent}22` : "transparent", color: href === "/products" ? C.sbAccent : C.sbText, fontWeight: href === "/products" ? 700 : 400, fontSize: 13, cursor: "pointer", marginBottom: 4, textAlign: "left", borderLeft: `3px solid ${href === "/products" ? C.sbAccent : "transparent"}` }}>
                <span style={{ fontSize: 16 }}>{icon}</span>{label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          <div style={{ background: C.bgCard, borderBottom: `1px solid ${C.border}`, padding: "0 28px", height: 56, display: "flex", alignItems: "center", position: "sticky", top: 0, zIndex: 40 }}>
            <span style={{ fontFamily: "'Georgia',serif", fontSize: 16, fontWeight: 700, color: C.text }}>🏷️ Product Management</span>
          </div>
          <div style={{ padding: 28 }}>
            <AdminProducts />
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}