// ─────────────────────────────────────────────────────────────────────────────
// src/integrations/shiprocket.service.ts
// Complete Shiprocket integration: auth, orders, AWB, pickup, tracking, NDR
// ─────────────────────────────────────────────────────────────────────────────

import { logger }   from "../utils/logger";
import { AppError } from "../utils/AppError";
import { redis }    from "../config/redis";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ShiprocketOrderItem {
  name:        string;
  sku:         string;
  units:       number;
  selling_price: number;
  discount?:   number;
  tax?:        number;
  hsn?:        number;
}

export interface CreateShiprocketOrderParams {
  orderId:        string;  // your internal order ID
  orderDate:      string;  // ISO date string
  customer: {
    name:    string;
    email:   string;
    phone:   string;
    address: string;
    address2?: string;
    city:    string;
    state:   string;
    pincode: string;
    country: string;
  };
  items:          ShiprocketOrderItem[];
  paymentMethod:  "Prepaid" | "COD";
  subTotal:       number;
  length:         number;  // cm
  breadth:        number;
  height:         number;
  weight:         number;  // kg
}

export interface ShiprocketTracking {
  awb:          string;
  status:       string;
  statusCode:   string;
  currentLocation: string;
  deliveryDate: string | null;
  activities:   Array<{
    date:        string;
    activity:    string;
    location:    string;
    status:      string;
  }>;
}

export interface ShiprocketCourier {
  courierId:   number;
  courierName: string;
  rate:        number;
  estimatedDays: number;
  etd:         string;
  rating:      number;
  isRecommended: boolean;
}

// ── Shiprocket Service ────────────────────────────────────────────────────────

export class ShiprocketService {
  private baseUrl   = "https://apiv2.shiprocket.in/v1/external";
  private email     = process.env.SHIPROCKET_EMAIL!;
  private password  = process.env.SHIPROCKET_PASSWORD!;
  private tokenKey  = "shiprocket:token";

  // ── Auth — get / cache JWT token ──────────────────────────────────────────

  async getToken(): Promise<string> {
    // Check Redis cache first (token valid ~10 days)
    const cached = await redis.get(this.tokenKey);
    if (cached) return cached;

    if (process.env.NODE_ENV === "development") {
      const mockToken = "mock_shiprocket_token_dev";
      await redis.setex(this.tokenKey, 3600, mockToken);
      return mockToken;
    }

    try {
      const res = await fetch(`${this.baseUrl}/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: this.email, password: this.password }),
      });

      if (!res.ok) throw new Error(`Auth failed: ${res.statusText}`);

      const data = await res.json() as { token: string };
      if (!data.token) throw new Error("No token in Shiprocket response");

      // Cache for 9 days (token lasts 10 days)
      await redis.setex(this.tokenKey, 9 * 24 * 60 * 60, data.token);
      logger.info("Shiprocket token refreshed");
      return data.token;
    } catch (err) {
      logger.error("Shiprocket auth failed:", err);
      throw new AppError("Shipping service authentication failed", 502);
    }
  }

  // ── Generic request helper ─────────────────────────────────────────────────

  private async request<T>(
    endpoint: string,
    method:   "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?:    unknown
  ): Promise<T> {
    if (process.env.NODE_ENV === "development") {
      return this.mockResponse<T>(endpoint, body);
    }

    const token = await this.getToken();
    const res   = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        "Content-Type":  "application/json",
        Authorization:   `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      // Token expired — delete cache and retry once
      await redis.del(this.tokenKey);
      const freshToken = await this.getToken();
      const retry = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${freshToken}` },
        body:    body ? JSON.stringify(body) : undefined,
      });
      if (!retry.ok) throw new AppError(`Shiprocket error: ${retry.statusText}`, 502);
      return retry.json() as Promise<T>;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      throw new AppError(`Shiprocket error: ${err.message || res.statusText}`, 502);
    }

    return res.json() as Promise<T>;
  }

  // ── Create Shiprocket Order ────────────────────────────────────────────────

  async createOrder(params: CreateShiprocketOrderParams): Promise<{
    shiprocketOrderId: number;
    channelOrderId:    string;
    awb:               string;
    courierName:       string;
  }> {
    const payload = {
      order_id:       params.orderId,
      order_date:     params.orderDate,
      pickup_location:"Primary",             // configured in Shiprocket dashboard
      channel_id:     "",
      comment:        "KhatuMart Order",
      billing_customer_name:    params.customer.name,
      billing_last_name:        "",
      billing_address:          params.customer.address,
      billing_address_2:        params.customer.address2 || "",
      billing_city:             params.customer.city,
      billing_pincode:          params.customer.pincode,
      billing_state:            params.customer.state,
      billing_country:          params.customer.country,
      billing_email:            params.customer.email,
      billing_phone:            params.customer.phone,
      shipping_is_billing:      true,
      order_items:              params.items.map(item => ({
        name:          item.name,
        sku:           item.sku,
        units:         item.units,
        selling_price: item.selling_price,
        discount:      item.discount || 0,
        tax:           item.tax || 0,
        hsn:           item.hsn || 0,
      })),
      payment_method:   params.paymentMethod,
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount:   0,
      sub_total:        params.subTotal,
      length:           params.length,
      breadth:          params.breadth,
      height:           params.height,
      weight:           params.weight,
    };

    const result = await this.request<{
      order_id:      number;
      channel_order_id: string;
      shipment_id:   number;
      status:        string;
      awb_code:      string;
      courier_name:  string;
    }>("/orders/create/adhoc", "POST", payload);

    logger.info(`Shiprocket order created: ${result.order_id} | AWB: ${result.awb_code}`);

    return {
      shiprocketOrderId: result.order_id,
      channelOrderId:    result.channel_order_id,
      awb:               result.awb_code,
      courierName:       result.courier_name,
    };
  }

  // ── Check Courier Serviceability & Rates ──────────────────────────────────

  async getAvailableCouriers(params: {
    pickupPincode:   string;
    deliveryPincode: string;
    weight:          number;   // kg
    cod:             boolean;
  }): Promise<ShiprocketCourier[]> {
    const data = await this.request<{
      data: {
        available_courier_companies: Array<{
          courier_company_id: number;
          courier_name:       string;
          rate:               number;
          etd:                string;
          estimated_delivery_days: number;
          rating:             number;
          is_recommended:     number;
        }>;
      };
    }>(
      `/courier/serviceability?pickup_postcode=${params.pickupPincode}&delivery_postcode=${params.deliveryPincode}&weight=${params.weight}&cod=${params.cod ? 1 : 0}`
    );

    return (data.data?.available_courier_companies || []).map(c => ({
      courierId:     c.courier_company_id,
      courierName:   c.courier_name,
      rate:          c.rate,
      estimatedDays: c.estimated_delivery_days,
      etd:           c.etd,
      rating:        c.rating,
      isRecommended: c.is_recommended === 1,
    }));
  }

  // ── Assign AWB ────────────────────────────────────────────────────────────

  async assignAWB(shipmentId: number, courierId?: number): Promise<string> {
    const result = await this.request<{ awb_code: string; courier_name: string }>(
      "/courier/assign/awb",
      "POST",
      { shipment_id: shipmentId, courier_id: courierId }
    );
    logger.info(`AWB assigned: ${result.awb_code}`);
    return result.awb_code;
  }

  // ── Schedule Pickup ───────────────────────────────────────────────────────

  async schedulePickup(shipmentIds: number[]): Promise<{
    pickupDate:    string;
    pickupSlot:    string;
    pickupToken:   string;
  }> {
    const result = await this.request<{
      pickup_scheduled_date: string;
      pickup_slot:           string;
      pickup_token_number:   string;
    }>("/courier/generate/pickup", "POST", { shipment_id: shipmentIds });

    return {
      pickupDate:  result.pickup_scheduled_date,
      pickupSlot:  result.pickup_slot,
      pickupToken: result.pickup_token_number,
    };
  }

  // ── Generate Shipping Label ────────────────────────────────────────────────

  async generateLabel(shipmentIds: number[]): Promise<string> {
    const result = await this.request<{ label_url: string }>(
      "/courier/generate/label",
      "POST",
      { shipment_id: shipmentIds }
    );
    return result.label_url;
  }

  // ── Generate Invoice ──────────────────────────────────────────────────────

  async generateInvoice(orderIds: number[]): Promise<string> {
    const result = await this.request<{ invoice_url: string }>(
      "/orders/print/invoice",
      "POST",
      { ids: orderIds }
    );
    return result.invoice_url;
  }

  // ── Track Shipment ────────────────────────────────────────────────────────

  async trackByAWB(awb: string): Promise<ShiprocketTracking> {
    const result = await this.request<{
      tracking_data: {
        track_status:    number;
        shipment_status: string;
        shipment_track:  Array<{
          awb_code:   string;
          current_status: string;
          current_status_id: number;
          delivered_date: string | null;
          etd:            string;
        }>;
        shipment_track_activities: Array<{
          date:     string;
          activity: string;
          location: string;
          status:   string;
        }>;
      };
    }>(`/courier/track/awb/${awb}`);

    const track = result.tracking_data;
    const shipment = track.shipment_track?.[0];

    return {
      awb,
      status:          shipment?.current_status || "Unknown",
      statusCode:      String(shipment?.current_status_id || 0),
      currentLocation: track.shipment_track_activities?.[0]?.location || "",
      deliveryDate:    shipment?.delivered_date || null,
      activities:      (track.shipment_track_activities || []).map(a => ({
        date:     a.date,
        activity: a.activity,
        location: a.location,
        status:   a.status,
      })),
    };
  }

  // ── Track by Order ID ─────────────────────────────────────────────────────

  async trackByOrderId(orderId: string): Promise<ShiprocketTracking> {
    const result = await this.request<{
      awb:    string;
      status: string;
    }>(`/courier/track?order_id=${orderId}`);

    return this.trackByAWB(result.awb);
  }

  // ── Cancel Shipment ───────────────────────────────────────────────────────

  async cancelShipment(awbs: string[]): Promise<void> {
    await this.request("/orders/cancel", "POST", { awbs });
    logger.info(`Shipment cancelled: ${awbs.join(", ")}`);
  }

  // ── Handle NDR (Non-Delivery Report) ─────────────────────────────────────

  async handleNDR(params: {
    awb:    string;
    action: "re-attempt" | "return";
    reattemptDate?: string;
    remarks?: string;
  }): Promise<void> {
    await this.request("/ndr/action", "POST", {
      awb:             params.awb,
      action:          params.action,
      reattempt_date:  params.reattemptDate,
      remarks:         params.remarks || "",
    });
    logger.info(`NDR action ${params.action} for AWB: ${params.awb}`);
  }

  // ── Calculate shipping rate ────────────────────────────────────────────────

  async calculateRate(params: {
    pickupPincode:   string;
    deliveryPincode: string;
    weight:          number;
    cod:             boolean;
    orderValue:      number;
  }): Promise<number> {
    if (params.orderValue >= 499) return 0; // free shipping

    const couriers = await this.getAvailableCouriers({
      pickupPincode:   params.pickupPincode,
      deliveryPincode: params.deliveryPincode,
      weight:          params.weight,
      cod:             params.cod,
    });

    if (!couriers.length) return 49; // default fallback

    // Return cheapest available rate
    return Math.min(...couriers.map(c => c.rate));
  }

  // ── Mock responses for development ────────────────────────────────────────

  private mockResponse<T>(endpoint: string, _body: unknown): Promise<T> {
    logger.info(`[SHIPROCKET MOCK] ${endpoint}`);

    const mocks: Record<string, unknown> = {
      "/orders/create/adhoc": {
        order_id:         Math.floor(Math.random() * 1000000),
        channel_order_id: `ORD-${Date.now()}`,
        shipment_id:      Math.floor(Math.random() * 1000000),
        status:           "NEW",
        awb_code:         `SR${Date.now()}`,
        courier_name:     "Shiprocket Surface",
      },
      "/courier/generate/pickup": {
        pickup_scheduled_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        pickup_slot:           "10:00 - 14:00",
        pickup_token_number:   `PKP${Date.now()}`,
      },
      "/courier/generate/label": {
        label_url: "https://example.com/mock-label.pdf",
      },
    };

    const key = Object.keys(mocks).find(k => endpoint.startsWith(k));
    return Promise.resolve((key ? mocks[key] : {}) as T);
  }

  // ── Shiprocket Webhook Parser ──────────────────────────────────────────────

  parseWebhook(body: Record<string, unknown>): {
    awb:      string;
    status:   string;
    orderId:  string;
    location: string;
  } {
    return {
      awb:      String(body.awb || ""),
      status:   String(body.current_status || ""),
      orderId:  String(body.order_id || ""),
      location: String(body.current_location || ""),
    };
  }
}

// Singleton export
export const shiprocketService = new ShiprocketService();