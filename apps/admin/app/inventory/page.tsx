"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import RequireAuth from "../_components/RequireAuth";
import { api } from "../_lib/api";

const C = {
  sb: "#0F0B07", sbBorder: "#2A1E0E", sbText: "#C8A870", sbDim: "#5A4030", sbAccent: "#E8560A",
  bg: "#FAF7F2", bgCard: "#FFFFFF", bgHover: "#F5F0E8", border: "#E8DDD0",
  saffron: "#E8560A", saffronBg: "#FFF3EC",
  marigold: "#F5A623", marigoldBg: "#FFFBE8",
  text: "#1A1208", textMid: "#5C4030", textLight: "#9A8070",
  green: "#1A7A3C", greenBg: "#EDFAF3",
  red: "#C0392B", redBg: "#FFF0EE",
  blue: "#1A5C9E", blueBg: "#EEF4FF",
  white: "#FFFFFF",
};

function productsFetcher(url: string) {
  return api.get<{ data: { products: any[]; pagination: any; stats: any } }>(url).then(r => r.data);
}
function logsFetcher(url: string) {
  return api.get<{ data: { logs: any[] } }>(url).then(r => r.data.logs);
}

function Card({ children, style = {} }: any) {
  return <div style={{ background: C.bgCard, borderRadius: 14, border: `1px solid ${C.border}`, ...style }}>{children}</div>;
}
function StockBadge({ stock, lowStockAt }: { stock: number; lowStockAt: number }) {
  let bg = C.greenBg, color = C.green, label = "In Stock";
  if (stock === 0) { bg = C.redBg; color = C.red; label = "Out of Stock"; }
  else if (stock <= lowStockAt) { bg = C.marigoldBg; color = "#B8790A"; label = "Low Stock"; }
  return <span style={{ background: bg, color, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 999 }}>{label}</span>;
}

// ─── STOCK ADJUST MODAL (inline panel, not a real overlay to keep this simple) ──
function AdjustPanel({ product, onClose, onSaved }: any) {
  const [operation, setOperation] = useState("add");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const { data: logs, mutate: mutateLogs } = useSWR(`/api/v1/products/admin/${product._id}/logs`, logsFetcher, { fallbackData: [] });

  const submit = async () => {
    const qty = Number(quantity);
    if (!qty && operation !== "set") return;
    setSaving(true);
    try {
      await api.patch(`/api/v1/products/${product._id}/stock`, { quantity: qty, operation, note: note || undefined });
      mutateLogs();
      onSaved();
      setQuantity(""); setNote("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={{ padding: 24, border: `1px solid ${C.saffron}33`, background: `${C.saffron}05`, marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: "'Georgia',serif", fontSize: 17, color: C.text }}>{product.name}</div>
          <div style={{ fontSize: 12, color: C.textLight, fontFamily: "'Courier New',monospace" }}>{product.sku} · Current stock: <strong style={{ color: C.text }}>{product.stock}</strong></div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.textLight, fontSize: 18, cursor: "pointer" }}>✕</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, alignItems: "flex-end", marginBottom: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMid, marginBottom: 6, textTransform: "uppercase" }}>Operation</label>
          <div style={{ display: "flex", gap: 6 }}>
            {[["add", "+ Add"], ["subtract", "− Remove"], ["set", "= Set"]].map(([k, l]) => (
              <button key={k} onClick={() => setOperation(k)} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1.5px solid ${operation === k ? C.saffron : C.border}`, background: operation === k ? C.saffron : "transparent", color: operation === k ? C.white : C.textMid, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>{l}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMid, marginBottom: 6, textTransform: "uppercase" }}>Quantity</label>
          <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g. 50"
            style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, background: C.bgHover, outline: "none" }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMid, marginBottom: 6, textTransform: "uppercase" }}>Note (optional)</label>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. New Diwali shipment"
            style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, background: C.bgHover, outline: "none" }} />
        </div>
        <button onClick={submit} disabled={saving || (!quantity && operation !== "set")}
          style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: C.saffron, color: C.white, fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1, whiteSpace: "nowrap" }}>
          {saving ? "Saving…" : "Apply"}
        </button>
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: C.textMid, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Recent Adjustments</div>
      <div style={{ maxHeight: 180, overflow: "auto", borderRadius: 10, border: `1px solid ${C.border}` }}>
        {(logs || []).length === 0 && <div style={{ padding: 14, fontSize: 12, color: C.textLight, textAlign: "center" }}>No stock adjustments logged yet.</div>}
        {(logs || []).map((l: any) => (
          <div key={l._id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
            <span style={{ color: C.textMid }}>{new Date(l.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })} · {l.reason.replace("_", " ")} {l.note ? `— ${l.note}` : ""}{l.performedBy?.name ? ` (by ${l.performedBy.name})` : ""}</span>
            <span style={{ fontWeight: 700, color: l.change >= 0 ? C.green : C.red }}>{l.change >= 0 ? "+" : ""}{l.change}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AdminInventory() {
  const [stockFilter, setStockFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [adjusting, setAdjusting] = useState<any | null>(null);

  const qs = new URLSearchParams({ status: "all", stockFilter, page: String(page), limit: "25", sortBy: "stock", sortOrder: "asc", ...(search ? { q: search } : {}) }).toString();
  const { data, mutate, isLoading } = useSWR(`/api/v1/products/admin/all?${qs}`, productsFetcher);

  const products = data?.products || [];
  const stats = data?.stats || { total: 0, lowStockCount: 0, outOfStockCount: 0 };
  const pagination = data?.pagination || { pages: 1 };
  const inStockCount = stats.total - (stats.lowStockCount || 0) - (stats.outOfStockCount || 0);

  const STAT_CARDS = [
    { label: "Total Products", value: stats.total, icon: "📦", color: C.saffron, key: "all" },
    { label: "Healthy Stock", value: inStockCount, icon: "✅", color: C.green, key: "in" },
    { label: "Low Stock", value: stats.lowStockCount, icon: "⚠️", color: "#B8790A", key: "low" },
    { label: "Out of Stock", value: stats.outOfStockCount, icon: "🚫", color: C.red, key: "out" },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {STAT_CARDS.map(s => (
          <Card key={s.label} style={{ padding: "16px 18px", cursor: "pointer", border: `1.5px solid ${stockFilter === s.key ? C.saffron : C.border}` }}>
            <div onClick={() => { setStockFilter(s.key); setPage(1); }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.textLight }}>{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {adjusting && (
        <AdjustPanel product={adjusting} onClose={() => setAdjusting(null)} onSaved={() => mutate()} />
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="🔍 Search product or SKU…"
          style={{ flex: 1, padding: "9px 14px", borderRadius: 9, border: `1px solid ${C.border}`, fontSize: 13, background: C.bgCard, outline: "none" }} />
        <div style={{ display: "flex", gap: 6 }}>
          {[["all", "All"], ["low", "Low Stock"], ["out", "Out of Stock"], ["in", "In Stock"]].map(([k, l]) => (
            <button key={k} onClick={() => { setStockFilter(k); setPage(1); }} style={{ padding: "8px 14px", borderRadius: 999, border: `1.5px solid ${stockFilter === k ? C.saffron : C.border}`, background: stockFilter === k ? C.saffron : "transparent", color: stockFilter === k ? C.white : C.textMid, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>{l}</button>
          ))}
        </div>
      </div>

      <Card style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 12, padding: "12px 18px", background: C.bgHover, fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: 0.5 }}>
          <div>Product</div><div>Stock</div><div>Alert At</div><div>Status</div><div style={{ textAlign: "right" }}>Actions</div>
        </div>
        {isLoading && <div style={{ padding: 32, textAlign: "center", color: C.textLight, fontSize: 13 }}>Loading inventory…</div>}
        {!isLoading && products.length === 0 && <div style={{ padding: 32, textAlign: "center", color: C.textLight, fontSize: 13 }}>No products match this filter.</div>}
        {products.map((p: any) => (
          <div key={p._id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 12, alignItems: "center", padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{p.name}</div>
              <div style={{ fontSize: 11, color: C.textLight, fontFamily: "'Courier New',monospace" }}>{p.sku}</div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: p.stock === 0 ? C.red : p.stock <= p.lowStockAt ? "#B8790A" : C.text }}>{p.stock}</div>
            <div style={{ fontSize: 12, color: C.textLight }}>{p.lowStockAt}</div>
            <div><StockBadge stock={p.stock} lowStockAt={p.lowStockAt} /></div>
            <div style={{ textAlign: "right" }}>
              <button onClick={() => setAdjusting(p)} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bgHover, color: C.textMid, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>📦 Adjust Stock</button>
            </div>
          </div>
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

export default function InventoryModule() {
  const router = useRouter();
  return (
    <RequireAuth>
      <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Segoe UI','Helvetica Neue',sans-serif", background: C.bg }}>
        <div style={{ width: 220, flexShrink: 0, background: C.sb, borderRight: `1px solid ${C.sbBorder}`, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
          <div style={{ padding: "20px 18px 16px", borderBottom: `1px solid ${C.sbBorder}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>🏭</span>
              <div>
                <div style={{ fontFamily: "'Georgia',serif", fontWeight: 700, fontSize: 14, color: C.sbAccent }}>Inventory</div>
                <div style={{ fontSize: 9, color: C.sbDim, letterSpacing: 1.4, textTransform: "uppercase" }}>Stock Control</div>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, padding: "12px 10px" }}>
            {[["/dashboard", "📊", "Dashboard"], ["/products", "🏷️", "Products"], ["/inventory", "🏭", "Inventory"], ["/coupons", "🎟️", "Coupons"], ["/store", "🎨", "Store Management"]].map(([href, icon, label]) => (
              <button key={href as string} onClick={() => router.push(href as string)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderRadius: 9, border: "none", background: href === "/inventory" ? `${C.sbAccent}22` : "transparent", color: href === "/inventory" ? C.sbAccent : C.sbText, fontWeight: href === "/inventory" ? 700 : 400, fontSize: 13, cursor: "pointer", marginBottom: 4, textAlign: "left", borderLeft: `3px solid ${href === "/inventory" ? C.sbAccent : "transparent"}` }}>
                <span style={{ fontSize: 16 }}>{icon}</span>{label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          <div style={{ background: C.bgCard, borderBottom: `1px solid ${C.border}`, padding: "0 28px", height: 56, display: "flex", alignItems: "center", position: "sticky", top: 0, zIndex: 40 }}>
            <span style={{ fontFamily: "'Georgia',serif", fontSize: 16, fontWeight: 700, color: C.text }}>🏭 Inventory Management</span>
          </div>
          <div style={{ padding: 28 }}>
            <AdminInventory />
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}