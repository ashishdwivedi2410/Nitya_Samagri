// apps/web/lib/accountStore.ts
//
// Backs the /account page's profile + order-history views with the real
// backend. Loyalty fields (tier, points) have no backend model yet, so they
// default to a neutral "not available" state instead of being invented.

import { create } from "zustand";
import { apiFetch, getStoredUser } from "./auth";

export type AccountUser = {
  name: string;
  email: string;
  phone: string;
  joined: string;
  avatar: string;
  tier: string;
  points: number;
  totalOrders: number;
  totalSpend: number;
};

export type AccountOrder = {
  id: string;
  date: string;
  status: string;
  amount: number;
  items: { name: string; qty: number; price: number; icon: string }[];
  payment: string;
  courier: string;
  tracking: string;
  timeline: { label: string; date: string; done: boolean }[];
  canReturn: boolean;
  canReview: boolean;
};

const EMPTY_USER: AccountUser = {
  name: "", email: "", phone: "", joined: "", avatar: "?",
  // No loyalty-tier/points backend yet — 0/"Member" are safe placeholders
  // the UI can render (.toLocaleString() etc.) without a null guard.
  tier: "Member", points: 0, totalOrders: 0, totalSpend: 0,
};

// Maps backend order status → the display labels the account UI already
// uses (StatusBadge, filter chips).
function displayStatus(status: string): string {
  const map: Record<string, string> = {
    pending: "Confirmed", confirmed: "Confirmed", packed: "Confirmed",
    shipped: "Shipped", out_for_delivery: "Shipped",
    delivered: "Delivered", cancelled: "Cancelled", returned: "Cancelled",
  };
  return map[status] || status;
}

type AccountState = {
  user: AccountUser;
  orders: AccountOrder[];
  loading: boolean;
  error: string;
  load: () => Promise<void>;
};

export const useAccountStore = create<AccountState>((set) => ({
  user: EMPTY_USER,
  orders: [],
  loading: true,
  error: "",
  load: async () => {
    set({ loading: true, error: "" });
    try {
      const [meRes, ordersRes] = await Promise.all([
        apiFetch<{ data: { user: any } }>("/auth/me"),
        apiFetch<{ data: { orders: any[] } }>("/orders?limit=50"),
      ]);

      if (!meRes.ok) throw new Error(meRes.body.message || "Couldn't load your profile.");
      const u = meRes.body.data.user;
      const totalSpend = ordersRes.ok
        ? ordersRes.body.data.orders.reduce((s, o) => s + (o.paymentStatus === "paid" || o.status === "delivered" ? o.total : 0), 0)
        : 0;

      set({
        user: {
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "",
          avatar: (u.name || "?").trim().charAt(0).toUpperCase() || "?",
          tier: "Member",  // no loyalty-tier backend yet
          points: 0,       // no loyalty-points backend yet
          totalOrders: ordersRes.ok ? ordersRes.body.data.orders.length : 0,
          totalSpend,
        },
      });

      if (ordersRes.ok) {
        const orders: AccountOrder[] = ordersRes.body.data.orders.map((o: any) => ({
          id: o.orderId,
          date: o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "",
          status: displayStatus(o.status),
          amount: o.total,
          items: (o.items || []).map((it: any) => ({ name: it.productName, qty: it.qty, price: it.price, icon: "🪔" })),
          payment: (o.paymentMethod || "").toUpperCase(),
          courier: "—",   // not returned by the orders-list endpoint
          tracking: "—",  // only available from GET /orders/:orderId
          timeline: [],   // ditto — would need a per-order detail fetch
          canReturn: o.status === "delivered",
          canReview: o.status === "delivered",
        }));
        set({ orders });
      } else {
        set({ error: ordersRes.body.message || "Couldn't load your orders." });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      set({ loading: false });
    }
  },
}));

// Cheap synchronous fallback so the header can show *something* (e.g. from
// the login response) before the /auth/me round-trip resolves.
export function storedUserFallback(): Partial<AccountUser> {
  const u = getStoredUser();
  return u ? { name: u.name, email: u.email || "", phone: u.phone || "", avatar: (u.name || "?").charAt(0).toUpperCase() } : {};
}