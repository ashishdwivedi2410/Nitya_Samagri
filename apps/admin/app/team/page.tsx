"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import RequireAuth from "../_components/RequireAuth";
import { api } from "../_lib/api";
import { getAdminSession } from "../_lib/adminAuth";

const C = {
  sb: "#0F0B07", sbBorder: "#2A1E0E", sbText: "#C8A870", sbDim: "#5A4030", sbAccent: "#E8560A",
  bg: "#FAF7F2", bgCard: "#FFFFFF", bgHover: "#F5F0E8", border: "#E8DDD0",
  saffron: "#E8560A", saffronBg: "#FFF3EC",
  marigold: "#F5A623", marigoldBg: "#FFFBE8",
  text: "#1A1208", textMid: "#5C4030", textLight: "#9A8070",
  green: "#1A7A3C", greenBg: "#EDFAF3",
  red: "#C0392B", redBg: "#FFF0EE",
  blue: "#1A5C9E", blueBg: "#EEF4FF",
  purple: "#6B2EA8", purpleBg: "#F4EEFC",
  white: "#FFFFFF",
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin", admin: "Admin", order_manager: "Order Manager",
  warehouse: "Warehouse", support: "Support", pandit: "Pandit",
};

const fetcher = (url: string) => api.get<{ data: any }>(url).then(r => r.data);

function Card({ children, style = {} }: any) {
  return <div style={{ background: C.bgCard, borderRadius: 14, border: `1px solid ${C.border}`, ...style }}>{children}</div>;
}
function Input({ label, type = "text", value, onChange, placeholder, helper }: any) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMid, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text, background: C.bgHover, outline: "none", fontFamily: "inherit" }} />
      {helper && <p style={{ fontSize: 11, color: C.textLight, margin: "4px 0 0" }}>{helper}</p>}
    </div>
  );
}
function RoleBadge({ role }: { role: string }) {
  const colorMap: Record<string, { bg: string; color: string }> = {
    super_admin: { bg: C.purpleBg, color: C.purple }, admin: { bg: C.saffronBg, color: C.saffron },
    order_manager: { bg: C.blueBg, color: C.blue }, warehouse: { bg: C.marigoldBg, color: "#B8790A" },
    support: { bg: C.greenBg, color: C.green }, pandit: { bg: C.bgHover, color: C.textMid },
  };
  const s = colorMap[role] || colorMap.support;
  return <span style={{ background: s.bg, color: s.color, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 999 }}>{ROLE_LABELS[role] || role}</span>;
}
function StatusDot({ status }: { status: string }) {
  const active = status === "active";
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: active ? C.green : C.red }}>
    <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? C.green : C.red }} />{active ? "Active" : "Blocked"}
  </span>;
}

// ─── PERMISSION CHECKBOX GRID ───────────────────────────────────────────────
function PermissionGrid({ catalog, selected, onToggle }: any) {
  const groups: Record<string, any[]> = {};
  for (const p of catalog || []) { (groups[p.group] ||= []).push(p); }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {Object.entries(groups).map(([group, perms]) => (
        <div key={group} style={{ background: C.bgHover, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textMid, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>{group}</div>
          {perms.map((p: any) => (
            <label key={p.key} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={selected.includes(p.key)} onChange={() => onToggle(p.key)} style={{ marginTop: 2 }} />
              <span style={{ fontSize: 12, color: C.text }}>{p.label}</span>
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── ADD / EDIT MEMBER FORM ─────────────────────────────────────────────────
const EMPTY_MEMBER = { name: "", email: "", phone: "", role: "support", roleTemplate: "", permissions: [] as string[], password: "" };

function MemberForm({ initial, catalog, defaultsByRole, roles, onSave, onCancel }: any) {
  const [form, setForm] = useState<any>(initial || EMPTY_MEMBER);
  const upd = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));
  const applyBaseRole = (role: string) => setForm((f: any) => ({ ...f, role, permissions: defaultsByRole[role] || [] }));
  const applyTemplate = (roleTemplateId: string) => {
    const tpl = (roles || []).find((r: any) => r._id === roleTemplateId);
    setForm((f: any) => ({ ...f, roleTemplate: roleTemplateId, permissions: tpl ? Array.from(new Set([...f.permissions, ...tpl.permissions])) : f.permissions }));
  };
  const togglePerm = (key: string) => setForm((f: any) => ({ ...f, permissions: f.permissions.includes(key) ? f.permissions.filter((p: string) => p !== key) : [...f.permissions, key] }));

  return (
    <Card style={{ padding: 24, border: `1px solid ${C.saffron}33`, background: `${C.saffron}05` }}>
      <div style={{ fontFamily: "'Georgia',serif", fontSize: 18, color: C.text, marginBottom: 20 }}>
        {initial?._id ? `Edit ${initial.name}` : "Add Team Member"}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <Input label="Full Name" value={form.name} onChange={upd("name")} placeholder="e.g. Priya Sharma" />
          <Input label="Staff Email" value={form.email} onChange={upd("email")} placeholder="priya@adminns.in" helper="Must end in @adminns.in — this is how they'll log in" disabled={!!initial?._id} />
          <Input label="Phone" value={form.phone} onChange={upd("phone")} placeholder="+91XXXXXXXXXX" />
          {!initial?._id && <Input label="Temporary Password (optional)" value={form.password} onChange={upd("password")} placeholder="Leave blank to auto-generate" helper="You'll see it once after creating — share it securely" />}
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMid, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Base Role</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {Object.entries(ROLE_LABELS).filter(([k]) => k !== "super_admin").map(([k, l]) => (
              <button key={k} onClick={() => applyBaseRole(k)} style={{ padding: "8px 14px", borderRadius: 9, border: `1.5px solid ${form.role === k ? C.saffron : C.border}`, background: form.role === k ? C.saffron : "transparent", color: form.role === k ? C.white : C.textMid, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>{l}</button>
            ))}
          </div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMid, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Apply Role Template (optional)</label>
          <select value={form.roleTemplate} onChange={e => applyTemplate(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text, background: C.bgHover, outline: "none", marginBottom: 6 }}>
            <option value="">None — use base role defaults</option>
            {(roles || []).map((r: any) => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
          <p style={{ fontSize: 11, color: C.textLight, margin: 0 }}>Applying a template adds its permissions on top of what's already checked below — it won't remove anything.</p>
        </div>
      </div>

      <div style={{ margin: "18px 0 14px" }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMid, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Permissions <span style={{ color: C.textLight, fontWeight: 400, textTransform: "none" }}>— extra access beyond the base role can be granted here</span>
        </label>
        <PermissionGrid catalog={catalog} selected={form.permissions} onToggle={togglePerm} />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => onSave(form)} style={{ flex: 1, padding: 12, borderRadius: 11, border: "none", background: C.saffron, color: C.white, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          {initial?._id ? "💾 Save Changes" : "✨ Add Member"}
        </button>
        <button onClick={onCancel} style={{ padding: "12px 20px", borderRadius: 11, border: `1.5px solid ${C.border}`, background: C.white, color: C.textMid, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancel</button>
      </div>
    </Card>
  );
}

// ─── ADD / EDIT ROLE TEMPLATE FORM ──────────────────────────────────────────
function RoleForm({ initial, catalog, onSave, onCancel }: any) {
  const [form, setForm] = useState<any>(initial || { name: "", description: "", permissions: [] as string[] });
  const togglePerm = (key: string) => setForm((f: any) => ({ ...f, permissions: f.permissions.includes(key) ? f.permissions.filter((p: string) => p !== key) : [...f.permissions, key] }));

  return (
    <Card style={{ padding: 24, border: `1px solid ${C.purple}33`, background: `${C.purple}05` }}>
      <div style={{ fontFamily: "'Georgia',serif", fontSize: 18, color: C.text, marginBottom: 20 }}>
        {initial?._id ? `Edit Role: ${initial.name}` : "Create Custom Role"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 6 }}>
        <Input label="Role Name" value={form.name} onChange={(e: any) => setForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="e.g. Festival Content Editor" />
        <Input label="Description (optional)" value={form.description} onChange={(e: any) => setForm((f: any) => ({ ...f, description: e.target.value }))} placeholder="What this role is for" />
      </div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMid, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Permissions</label>
      <div style={{ marginBottom: 18 }}><PermissionGrid catalog={catalog} selected={form.permissions} onToggle={togglePerm} /></div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => onSave(form)} style={{ flex: 1, padding: 12, borderRadius: 11, border: "none", background: C.purple, color: C.white, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          {initial?._id ? "💾 Save Role" : "✨ Create Role"}
        </button>
        <button onClick={onCancel} style={{ padding: "12px 20px", borderRadius: 11, border: `1.5px solid ${C.border}`, background: C.white, color: C.textMid, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancel</button>
      </div>
    </Card>
  );
}

// ─── MEMBERS TAB ─────────────────────────────────────────────────────────────
function MembersTab({ myId }: { myId?: string }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [tempPwBanner, setTempPwBanner] = useState<{ email: string; password: string } | null>(null);

  const { data: members, mutate, isLoading } = useSWR("/api/v1/team/members", (u) => fetcher(u).then(d => d.members), { fallbackData: [] });
  const { data: permData } = useSWR("/api/v1/team/permissions", fetcher, { fallbackData: { permissions: [], defaultsByRole: {} } });
  const { data: roles } = useSWR("/api/v1/team/roles", (u) => fetcher(u).then(d => d.roles), { fallbackData: [] });

  const save = async (form: any) => {
    const payload = { ...form, permissions: form.permissions, password: form.password || undefined };
    if (editing?._id) {
      await api.patch(`/api/v1/team/members/${editing._id}`, { name: form.name, role: form.role, roleTemplate: form.roleTemplate || null, permissions: form.permissions });
    } else {
      const res: any = await api.post("/api/v1/team/members", payload);
      if (res?.data?.temporaryPassword) setTempPwBanner({ email: form.email, password: res.data.temporaryPassword });
    }
    mutate(); setShowForm(false); setEditing(null);
  };
  const toggleStatus = async (m: any) => { await api.patch(`/api/v1/team/members/${m._id}`, { status: m.status === "active" ? "blocked" : "active" }); mutate(); };
  const remove = async (m: any) => { if (!confirm(`Block ${m.name}'s access? They'll keep their history but won't be able to log in.`)) return; await api.delete(`/api/v1/team/members/${m._id}`); mutate(); };

  return (
    <div>
      {tempPwBanner && (
        <Card style={{ padding: "14px 18px", marginBottom: 20, background: C.greenBg, border: `1px solid ${C.green}44`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, color: C.text }}>
            ✅ Member created. Temporary password for <strong>{tempPwBanner.email}</strong>: <code style={{ background: C.white, padding: "3px 8px", borderRadius: 6, fontWeight: 700 }}>{tempPwBanner.password}</code>
            <div style={{ fontSize: 11, color: C.textLight, marginTop: 4 }}>Share this securely — it won't be shown again.</div>
          </div>
          <button onClick={() => setTempPwBanner(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.textLight }}>✕</button>
        </Card>
      )}

      {(showForm || editing) && (
        <div style={{ marginBottom: 24 }}>
          <MemberForm initial={editing} catalog={permData.permissions} defaultsByRole={permData.defaultsByRole} roles={roles}
            onSave={save} onCancel={() => { setShowForm(false); setEditing(null); }} />
        </div>
      )}

      {!showForm && !editing && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <button onClick={() => setShowForm(true)} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: C.saffron, color: C.white, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Add Team Member</button>
        </div>
      )}

      <Card style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1.4fr", gap: 12, padding: "12px 18px", background: C.bgHover, fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: 0.5 }}>
          <div>Member</div><div>Role</div><div>Permissions</div><div>Status</div><div style={{ textAlign: "right" }}>Actions</div>
        </div>
        {isLoading && <div style={{ padding: 32, textAlign: "center", color: C.textLight, fontSize: 13 }}>Loading team…</div>}
        {!isLoading && (members || []).length === 0 && <div style={{ padding: 32, textAlign: "center", color: C.textLight, fontSize: 13 }}>No team members yet — add your first one above.</div>}
        {(members || []).map((m: any) => (
          <div key={m._id} style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1.4fr", gap: 12, alignItems: "center", padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{m.name}{m._id === myId && <span style={{ marginLeft: 6, fontSize: 10, color: C.textLight }}>(you)</span>}</div>
              <div style={{ fontSize: 11, color: C.textLight }}>{m.email}</div>
            </div>
            <div><RoleBadge role={m.role} /></div>
            <div style={{ fontSize: 12, color: C.textMid }}>{m.role === "super_admin" ? "All" : `${m.permissions?.length || 0} granted`}</div>
            <div><StatusDot status={m.status} /></div>
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              {m.role !== "super_admin" && (
                <>
                  <button onClick={() => { setEditing({ ...m, roleTemplate: m.roleTemplate?._id || "" }); setShowForm(false); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bgHover, color: C.textMid, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>✏️ Edit</button>
                  <button onClick={() => toggleStatus(m)} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bgHover, color: C.textMid, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{m.status === "active" ? "🚫 Block" : "✅ Unblock"}</button>
                  {m._id !== myId && <button onClick={() => remove(m)} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.red}22`, background: C.redBg, color: C.red, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Remove</button>}
                </>
              )}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── ROLES TAB ───────────────────────────────────────────────────────────────
function RolesTab() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const { data: permData } = useSWR("/api/v1/team/permissions", fetcher, { fallbackData: { permissions: [] } });
  const { data: roles, mutate, isLoading } = useSWR("/api/v1/team/roles", (u) => fetcher(u).then(d => d.roles), { fallbackData: [] });

  const save = async (form: any) => {
    if (editing?._id) await api.patch(`/api/v1/team/roles/${editing._id}`, form);
    else await api.post("/api/v1/team/roles", form);
    mutate(); setShowForm(false); setEditing(null);
  };
  const remove = async (r: any) => {
    if (!confirm(`Delete role "${r.name}"? Members already using it keep their current permissions.`)) return;
    try { await api.delete(`/api/v1/team/roles/${r._id}`); mutate(); } catch (e: any) { alert(e?.message || "Couldn't delete this role."); }
  };

  return (
    <div>
      {(showForm || editing) && (
        <div style={{ marginBottom: 24 }}>
          <RoleForm initial={editing} catalog={permData.permissions} onSave={save} onCancel={() => { setShowForm(false); setEditing(null); }} />
        </div>
      )}
      {!showForm && !editing && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: C.textLight, margin: 0, maxWidth: 480 }}>Custom roles are reusable permission bundles you can apply when adding or editing a member — e.g. a "Content Editor" role covering products and store management only.</p>
          <button onClick={() => setShowForm(true)} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: C.purple, color: C.white, fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>+ Create Role</button>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
        {isLoading && <div style={{ color: C.textLight, fontSize: 13 }}>Loading roles…</div>}
        {(roles || []).map((r: any) => (
          <Card key={r._id} style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{r.name} {r.isSystem && <span style={{ fontSize: 10, color: C.textLight, fontWeight: 400 }}>(built-in)</span>}</div>
                {r.description && <div style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>{r.description}</div>}
              </div>
              {!r.isSystem && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => { setEditing(r); setShowForm(false); }} style={{ padding: "5px 9px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.bgHover, color: C.textMid, fontSize: 11, cursor: "pointer" }}>Edit</button>
                  <button onClick={() => remove(r)} style={{ padding: "5px 9px", borderRadius: 7, border: `1px solid ${C.red}22`, background: C.redBg, color: C.red, fontSize: 11, cursor: "pointer" }}>Delete</button>
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {(r.permissions || []).map((p: string) => <span key={p} style={{ fontSize: 10, background: C.bgHover, color: C.textMid, padding: "3px 8px", borderRadius: 999 }}>{p}</span>)}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
function TeamModule() {
  const [tab, setTab] = useState<"members" | "roles">("members");
  const session = typeof window !== "undefined" ? getAdminSession() : null;
  const isSuperAdmin = session?.user?.role === "super_admin";

  if (!isSuperAdmin) {
    return (
      <Card style={{ padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
        <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>Super Admins Only</div>
        <div style={{ fontSize: 13, color: C.textLight }}>Only a super admin can add team members or manage roles.</div>
      </Card>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        {[["members", "👥 Members"], ["roles", "🗝️ Roles & Permissions"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as any)} style={{ padding: "9px 18px", borderRadius: 999, border: `1.5px solid ${tab === k ? C.saffron : C.border}`, background: tab === k ? C.saffron : "transparent", color: tab === k ? C.white : C.textMid, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{l}</button>
        ))}
      </div>
      {tab === "members" ? <MembersTab myId={session?.user?.id} /> : <RolesTab />}
    </div>
  );
}

export default function TeamPage() {
  const router = useRouter();
  return (
    <RequireAuth>
      <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Segoe UI','Helvetica Neue',sans-serif", background: C.bg }}>
        <div style={{ width: 220, flexShrink: 0, background: C.sb, borderRight: `1px solid ${C.sbBorder}`, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
          <div style={{ padding: "20px 18px 16px", borderBottom: `1px solid ${C.sbBorder}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>👥</span>
              <div>
                <div style={{ fontFamily: "'Georgia',serif", fontWeight: 700, fontSize: 14, color: C.sbAccent }}>Team</div>
                <div style={{ fontSize: 9, color: C.sbDim, letterSpacing: 1.4, textTransform: "uppercase" }}>Super Admin</div>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, padding: "12px 10px" }}>
            {[["/dashboard", "📊", "Dashboard"], ["/products", "🏷️", "Products"], ["/inventory", "🏭", "Inventory"], ["/coupons", "🎟️", "Coupons"], ["/store", "🎨", "Store Management"], ["/team", "👥", "Team & Roles"]].map(([href, icon, label]) => (
              <button key={href as string} onClick={() => router.push(href as string)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderRadius: 9, border: "none", background: href === "/team" ? `${C.sbAccent}22` : "transparent", color: href === "/team" ? C.sbAccent : C.sbText, fontWeight: href === "/team" ? 700 : 400, fontSize: 13, cursor: "pointer", marginBottom: 4, textAlign: "left", borderLeft: `3px solid ${href === "/team" ? C.sbAccent : "transparent"}` }}>
                <span style={{ fontSize: 16 }}>{icon}</span>{label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          <div style={{ background: C.bgCard, borderBottom: `1px solid ${C.border}`, padding: "0 28px", height: 56, display: "flex", alignItems: "center", position: "sticky", top: 0, zIndex: 40 }}>
            <span style={{ fontFamily: "'Georgia',serif", fontSize: 16, fontWeight: 700, color: C.text }}>👥 Team & Roles</span>
          </div>
          <div style={{ padding: 28 }}>
            <TeamModule />
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}