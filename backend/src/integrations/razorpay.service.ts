// ─────────────────────────────────────────────────────────────────────────────
// src/integrations/razorpay.service.ts
// Complete Razorpay integration: orders, payments, refunds, webhooks, payouts
// ─────────────────────────────────────────────────────────────────────────────

import Razorpay from "razorpay";
import crypto   from "crypto";
import { logger } from "../utils/logger";
import { AppError } from "../utils/AppError";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CreateOrderParams {
  amount:      number;       // in rupees (will be converted to paise)
  currency?:   string;
  receipt:     string;       // your order ID e.g. ORD-2026-1999
  notes?: {
    orderId?:    string;
    customerId?: string;
    type?:       "product" | "pandit_booking";
  };
}

export interface RazorpayOrder {
  id:       string;
  amount:   number;
  currency: string;
  receipt:  string;
  status:   string;
}

export interface VerifyPaymentParams {
  razorpayOrderId:   string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface RefundParams {
  paymentId: string;
  amount?:   number;   // partial refund in rupees; omit for full refund
  reason?:   string;
  notes?:    Record<string, string>;
}

export interface PayoutParams {
  accountNumber: string;
  ifsc:          string;
  name:          string;
  amount:        number;   // in rupees
  purpose:       "puja_earnings" | "refund";
  referenceId:   string;
  narration?:    string;
}

export interface WebhookEvent {
  entity:  string;
  event:   string;
  payload: {
    payment?: { entity: Record<string, unknown> };
    refund?:  { entity: Record<string, unknown> };
    order?:   { entity: Record<string, unknown> };
  };
}

// ── Service class ─────────────────────────────────────────────────────────────

export class RazorpayService {
  private client: Razorpay;
  private keySecret: string;
  private webhookSecret: string;

  constructor() {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials not configured");
    }
    this.client = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    this.keySecret    = process.env.RAZORPAY_KEY_SECRET;
    this.webhookSecret= process.env.RAZORPAY_WEBHOOK_SECRET || "";
  }

  // ── Create Razorpay Order ──────────────────────────────────────────────────

  async createOrder(params: CreateOrderParams): Promise<RazorpayOrder> {
    try {
      const order = await this.client.orders.create({
        amount:   Math.round(params.amount * 100), // rupees → paise
        currency: params.currency || "INR",
        receipt:  params.receipt.slice(0, 40),     // max 40 chars
        notes:    params.notes as Record<string, string> | undefined,
      });

      logger.info(`Razorpay order created: ${order.id} for ₹${params.amount}`);
      return order as unknown as RazorpayOrder;
    } catch (err: unknown) {
      const e = err as { error?: { description: string } };
      logger.error("Razorpay createOrder failed:", e);
      throw new AppError(
        `Payment gateway error: ${e.error?.description || "Could not create payment order"}`,
        502
      );
    }
  }

  // ── Verify Payment Signature ───────────────────────────────────────────────

  verifyPaymentSignature(params: VerifyPaymentParams): boolean {
    const body     = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;
    const expected = crypto
      .createHmac("sha256", this.keySecret)
      .update(body)
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(params.razorpaySignature, "hex")
    );

    if (!isValid) {
      logger.warn(`Invalid Razorpay signature for order ${params.razorpayOrderId}`);
    }
    return isValid;
  }

  // ── Verify Webhook Signature ───────────────────────────────────────────────

  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    if (!this.webhookSecret) {
      logger.warn("Razorpay webhook secret not configured");
      return false;
    }
    const expected = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(rawBody)
      .digest("hex");

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expected, "hex"),
        Buffer.from(signature, "hex")
      );
    } catch {
      return false;
    }
  }

  // ── Fetch Payment Details ──────────────────────────────────────────────────

  async fetchPayment(paymentId: string) {
    try {
      const payment = await this.client.payments.fetch(paymentId);
      return payment;
    } catch (err: unknown) {
      logger.error(`Failed to fetch payment ${paymentId}:`, err);
      throw new AppError("Could not fetch payment details", 502);
    }
  }

  // ── Capture Payment (if not auto-captured) ─────────────────────────────────

  async capturePayment(paymentId: string, amount: number) {
    try {
      const captured = await this.client.payments.capture(
        paymentId,
        Math.round(amount * 100),
        "INR"
      );
      logger.info(`Payment captured: ${paymentId} ₹${amount}`);
      return captured;
    } catch (err: unknown) {
      logger.error(`Failed to capture payment ${paymentId}:`, err);
      throw new AppError("Payment capture failed", 502);
    }
  }

  // ── Initiate Refund ────────────────────────────────────────────────────────

  async initiateRefund(params: RefundParams) {
    try {
      const refundData: Record<string, unknown> = {
        notes: {
          reason:      params.reason || "Refund initiated",
          referenceId: params.referenceId || params.paymentId,
          ...params.notes,
        },
      };
      if (params.amount) {
        refundData.amount = Math.round(params.amount * 100);
      }

      const refund = await this.client.payments.refund(
        params.paymentId,
        refundData as Parameters<typeof this.client.payments.refund>[1]
      );

      logger.info(`Refund initiated: ${refund.id} for payment ${params.paymentId}`);
      return refund;
    } catch (err: unknown) {
      const e = err as { error?: { description: string } };
      logger.error("Razorpay refund failed:", e);
      throw new AppError(
        `Refund failed: ${e.error?.description || "Could not process refund"}`,
        502
      );
    }
  }

  // ── Fetch Refund Status ────────────────────────────────────────────────────

  async fetchRefund(paymentId: string, refundId: string) {
    try {
      return await this.client.payments.fetchRefund(paymentId, refundId);
    } catch (err: unknown) {
      logger.error(`Failed to fetch refund ${refundId}:`, err);
      throw new AppError("Could not fetch refund status", 502);
    }
  }

  // ── Pandit Payout via Razorpay X ──────────────────────────────────────────
  // Requires Razorpay X (fund account) setup

  async initiatePayout(params: PayoutParams): Promise<string> {
    if (process.env.NODE_ENV === "development") {
      logger.info(`[PAYOUT MOCK] To: ${params.name} | Amount: ₹${params.amount}`);
      return `pout_mock_${Date.now()}`;
    }

    try {
      // Step 1: Create fund account
      const fundAccount = await fetch(
        "https://api.razorpay.com/v1/fund_accounts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(
              `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
            ).toString("base64")}`,
          },
          body: JSON.stringify({
            contact_id: params.referenceId,
            account_type: "bank_account",
            bank_account: {
              name:           params.name,
              ifsc:           params.ifsc,
              account_number: params.accountNumber,
            },
          }),
        }
      ).then(r => r.json()) as { id: string };

      // Step 2: Create payout
      const payout = await fetch(
        "https://api.razorpay.com/v1/payouts",
        {
          method: "POST",
          headers: {
            "Content-Type":    "application/json",
            "X-Payout-Idempotency": params.referenceId,
            Authorization: `Basic ${Buffer.from(
              `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
            ).toString("base64")}`,
          },
          body: JSON.stringify({
            account_number:  process.env.RAZORPAY_ACCOUNT_NUMBER,
            fund_account_id: fundAccount.id,
            amount:          Math.round(params.amount * 100),
            currency:        "INR",
            mode:            "NEFT",
            purpose:         "payout",
            queue_if_low_balance: true,
            reference_id:    params.referenceId,
            narration:       params.narration || `nityasamagri ${params.purpose}`,
          }),
        }
      ).then(r => r.json()) as { id: string };

      logger.info(`Payout initiated: ${payout.id} ₹${params.amount} to ${params.name}`);
      return payout.id;
    } catch (err) {
      logger.error("Payout failed:", err);
      throw new AppError("Payout initiation failed", 502);
    }
  }

  // ── Parse Webhook Event ────────────────────────────────────────────────────

  parseWebhookEvent(rawBody: Buffer): WebhookEvent {
    try {
      return JSON.parse(rawBody.toString()) as WebhookEvent;
    } catch {
      throw new AppError("Invalid webhook payload", 400);
    }
  }

  // ── Checkout config for frontend ──────────────────────────────────────────

  getCheckoutConfig(params: {
    orderId:   string;
    amount:    number;
    name:      string;
    phone:     string;
    email?:    string;
    orderRef:  string;
  }) {
    return {
      key:         process.env.RAZORPAY_KEY_ID,
      amount:      Math.round(params.amount * 100),
      currency:    "INR",
      name:        "nityasamagri",
      description: `Order ${params.orderRef}`,
      image:       "https://nityasamagri.com/logo.png",
      order_id:    params.orderId,
      prefill: {
        name:    params.name,
        email:   params.email || "",
        contact: params.phone,
      },
      notes: { order_ref: params.orderRef },
      theme: { color: "#E8560A" },
      config: {
        display: {
          blocks: {
            upi:  { name: "UPI",        instruments: [{ method: "upi" }] },
            card: { name: "Cards",      instruments: [{ method: "card" }] },
            nb:   { name: "Net Banking",instruments: [{ method: "netbanking" }] },
          },
          sequence: ["block.upi", "block.card", "block.nb"],
          preferences: { show_default_blocks: true },
        },
      },
    };
  }
}

// Singleton export
export const razorpayService = new RazorpayService();