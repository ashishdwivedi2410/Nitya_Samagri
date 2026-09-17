// ─────────────────────────────────────────────────────────────────────────────
// src/integrations/eshopbox.service.ts
//
// Replaces src/integrations/shiprocket.service.ts. Same public method
// surface (createOrder, trackByAWB, cancelShipment, etc.) so callers in
// order.routes.ts / integrations.routes.ts need only a rename, not a
// rewrite — but the actual endpoints underneath are different, since
// Eshopbox is a full 3PL/WMS (they run the warehouse) rather than a
// shipping-rate aggregator like Shiprocket.
//
// CONFIDENCE LEVELS (verify against your Eshopbox workspace docs before
// relying on this in production):
//   ✅ HIGH   — createOrder: confirmed via https://eshop.gitbook.io/eshopbox-developers
//               POST https://wms.eshopbox.com/api/order, Bearer auth
//   ✅ HIGH   — auth: confirmed to be a static Bearer API key generated in
//               the Eshopbox workspace UI (not an OAuth refresh flow)
//   ⚠️ MEDIUM — tracking/cancel/webhook shapes: Eshopbox is primarily
//               webhook-driven for status updates (they push to you rather
//               than you polling), so trackByAWB/trackByOrderId here are
//               best-effort GET requests against the order-status endpoint
//               pattern their docs use elsewhere — confirm the exact path
//               in your workspace's API reference before going live
//   ❌ LOW    — getAvailableCouriers/assignAWB/schedulePickup/generateLabel:
//               Eshopbox manages courier assignment and pickup internally
//               as part of fulfillment, so these likely have no 1:1
//               equivalent. Left as thin no-ops/throws so callers fail
//               loudly instead of silently, rather than guessing endpoints
// ─────────────────────────────────────────────────────────────────────────────

import { logger } from "../utils/logger";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";

// ── Types (kept identical to the old Shiprocket types so callers don't need
// to touch their own type imports beyond the module path) ─────────────────

export interface EshopboxOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn?: number;
}

export interface CreateEshopboxOrderParams {
  orderId: string;
  orderDate: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    address2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  items: EshopboxOrderItem[];
  paymentMethod: "Prepaid" | "COD";
  subTotal: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

export interface EshopboxTracking {
  awb: string;
  status: string;
  statusCode: string;
  currentLocation: string;
  deliveryDate: string | null;
  activities: Array<{ date: string; activity: string; location: string; status: string }>;
}

// ── Eshopbox Service ─────────────────────────────────────────────────────────

export class EshopboxService {
  private wmsUrl = "https://wms.eshopbox.com/api";
  private apiToken = env.ESHOPBOX_API_TOKEN;
  private externalChannelId = env.ESHOPBOX_EXTERNAL_CHANNEL_ID;

  // ── Generic request helper ─────────────────────────────────────────────────

  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: unknown
  ): Promise<T> {
    if (process.env.NODE_ENV === "development") {
      return this.mockResponse<T>(endpoint, body);
    }

    if (!this.apiToken) {
      throw new AppError("Eshopbox is not configured (ESHOPBOX_API_TOKEN missing)", 500);
    }

    const res = await fetch(`${this.wmsUrl}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      throw new AppError(`Eshopbox error: ${err.message || res.statusText}`, 502);
    }

    return res.json() as Promise<T>;
  }

  // ── Create Order — CONFIRMED endpoint/shape ────────────────────────────────

  async createOrder(params: CreateEshopboxOrderParams): Promise<{
    eshopboxOrderId: string;
    channelOrderId: string;
  }> {
    const payload = {
      externalChannelID: this.externalChannelId,
      customerOrderNumber: params.orderId,
      orderDate: params.orderDate,
      isCOD: params.paymentMethod === "COD" ? "1" : "0",
      paymentType: params.paymentMethod,
      thirdPartyShipping: false, // Eshopbox arranges shipping
      shipChargeAmount: 0,
      subtotal: params.subTotal,
      orderTotal: params.subTotal,
      balanceDue: params.paymentMethod === "COD" ? params.subTotal : 0,
      shippingAddress: {
        customerName: params.customer.name,
        addressLine1: params.customer.address,
        addressLine2: params.customer.address2 || "",
        city: params.customer.city,
        state: params.customer.state,
        postalCode: params.customer.pincode,
        countryCode: params.customer.country,
        countryName: params.customer.country === "IN" ? "India" : params.customer.country,
        contactPhone: params.customer.phone,
        email: params.customer.email,
      },
      orderItems: params.items.map((item) => ({
        sku: item.sku,
        itemName: item.name,
        quantity: item.units,
        unitPrice: item.selling_price,
        discount: item.discount || 0,
        taxAmount: item.tax || 0,
        hsn: item.hsn,
      })),
    };

    const result = await this.request<{ orderId: string; customerOrderNumber: string }>(
      "/order",
      "POST",
      payload
    );

    logger.info(`Eshopbox order created: ${result.orderId} (${params.orderId})`);

    return { eshopboxOrderId: result.orderId, channelOrderId: result.customerOrderNumber };
  }

  // ── Track by order — MEDIUM confidence, verify path in your workspace ──────

  async trackByOrderId(orderId: string): Promise<EshopboxTracking> {
    const result = await this.request<{
      orderId: string;
      status: string;
      awbNumber?: string;
      courierName?: string;
      currentLocation?: string;
      deliveredDate?: string | null;
      trackingHistory?: Array<{ date: string; remark: string; location: string; status: string }>;
    }>(`/order/${orderId}`);

    return {
      awb: result.awbNumber || "",
      status: result.status,
      statusCode: result.status,
      currentLocation: result.currentLocation || "",
      deliveryDate: result.deliveredDate || null,
      activities: (result.trackingHistory || []).map((a) => ({
        date: a.date,
        activity: a.remark,
        location: a.location,
        status: a.status,
      })),
    };
  }

  async trackByAWB(awb: string): Promise<EshopboxTracking> {
    // No confirmed direct AWB-lookup endpoint — Eshopbox's docs track by
    // their own orderId. If you have the customerOrderNumber (your
    // internal order ID) use trackByOrderId() instead; this throws so a
    // caller relying on AWB-only lookup fails loudly rather than silently
    // returning wrong data.
    throw new AppError(
      `trackByAWB is not implemented for Eshopbox — use trackByOrderId(orderId) instead (awb: ${awb})`,
      501
    );
  }

  // ── Cancel — MEDIUM confidence ──────────────────────────────────────────────

  async cancelShipment(orderIds: string[]): Promise<void> {
    await this.request("/order/cancel", "POST", { orderIds });
    logger.info(`Eshopbox order(s) cancelled: ${orderIds.join(", ")}`);
  }

  // ── Not applicable to a managed 3PL — Eshopbox handles these internally ────

  async getAvailableCouriers(): Promise<never> {
    throw new AppError(
      "getAvailableCouriers is not applicable — Eshopbox assigns couriers internally as part of fulfillment",
      501
    );
  }

  async assignAWB(): Promise<never> {
    throw new AppError("assignAWB is not applicable — Eshopbox assigns AWBs internally", 501);
  }

  async schedulePickup(): Promise<never> {
    throw new AppError("schedulePickup is not applicable — pickups are scheduled by Eshopbox internally", 501);
  }

  async generateLabel(): Promise<never> {
    throw new AppError(
      "generateLabel is not applicable here — check the Eshopbox dashboard/docs for their label endpoint",
      501
    );
  }

  // ── Shipping rate — simplified to the same free-shipping-threshold logic
  // the old calculateRate() used, since Eshopbox doesn't expose a public
  // rate-shopping API the way Shiprocket's /courier/serviceability does.

  async calculateRate(params: { orderValue: number }): Promise<number> {
    if (params.orderValue >= 499) return 0;
    return 49; // flat fallback — replace with your actual Eshopbox shipping fee schedule
  }

  // ── Mock responses for development ──────────────────────────────────────────

  private mockResponse<T>(endpoint: string, _body: unknown): Promise<T> {
    logger.info(`[ESHOPBOX MOCK] ${endpoint}`);

    const mocks: Record<string, unknown> = {
      "/order": { orderId: `EB${Date.now()}`, customerOrderNumber: `ORD-${Date.now()}` },
    };

    const key = Object.keys(mocks).find((k) => endpoint.startsWith(k));
    return Promise.resolve((key ? mocks[key] : {}) as T);
  }

  // ── Webhook parser — MEDIUM confidence on exact field names, adjust once
  // you've seen a real webhook payload from your Eshopbox workspace ─────────

  parseWebhook(body: Record<string, unknown>): {
    orderId: string;
    status: string;
    awb: string;
    location: string;
  } {
    return {
      orderId: String(body.orderId || body.customerOrderNumber || ""),
      status: String(body.status || ""),
      awb: String(body.awbNumber || ""),
      location: String(body.currentLocation || ""),
    };
  }
}

// Singleton export — matches the old `shiprocketService` naming pattern
export const eshopboxService = new EshopboxService();