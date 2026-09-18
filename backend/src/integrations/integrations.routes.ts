// ─────────────────────────────────────────────────────────────────────────────
// src/integrations/integrations.routes.ts
// Shipping rate check, Eshopbox webhook, Razorpay checkout config
//
// Converted from Prisma/PostgreSQL to Mongoose/MongoDB, and from Shiprocket
// to Eshopbox. Eshopbox is a managed 3PL (they run the warehouse and
// assign couriers themselves), so routes that assumed Shiprocket's
// self-service courier-selection/pickup-scheduling API
// (/shipping/rates' per-courier list, /shipping/pickup, /shipping/ndr)
// have been simplified or removed — see the comments on each route below.
// ─────────────────────────────────────────────────────────────────────────────

import { Router, Request, Response } from "express";
import crypto from "crypto";
import { z } from "zod";
import { Order } from "../database/models/Order";
import { OrderTimeline } from "../database/models/OrderTimeline";
import { User } from "../database/models/User";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../middlewares/async.middleware";
import { authenticate } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validate } from "../middlewares/validate.middleware";
import { logger } from "../utils/logger";
import { razorpayService } from "./razorpay.service";
import { eshopboxService } from "./eshopbox.service";
import { emitOrderUpdate, emitToAdmins } from "../websocket/ws.server";
import { sendSMS } from "./twilio";

const router = Router();

function safeCompareString(expected: string, actual: string): boolean {
  const expectedBuf = Buffer.from(expected, "utf8");
  const actualBuf = Buffer.from(actual, "utf8");
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

// ── Schemas ───────────────────────────────────────────────────────────────────
const ShippingRatesQuerySchema = z.object({
  pincode: z.string().regex(/^\d{6}$/, "Invalid pincode"),
  weight: z.coerce.number().positive().default(0.5),
  orderValue: z.coerce.number().min(0).default(0),
  cod: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
});

const ShippingCreateSchema = z.object({
  orderId: z.string(),
});

// ── Shipping rate check (public) ──────────────────────────────────────────────

/**
 * GET /api/v1/integrations/shipping/rates?pincode=110070&weight=0.5&orderValue=599
 *
 * Simplified vs. the old Shiprocket version: Eshopbox has no public
 * rate-shopping API to list multiple couriers, so this just returns the
 * flat free-shipping-threshold rate from eshopboxService.calculateRate()
 * instead of a per-courier comparison list.
 */
router.get(
  "/shipping/rates",
  validate(ShippingRatesQuerySchema, "query"),
  asyncHandler(async (req: Request, res: Response) => {
    const q = req.query as unknown as z.infer<typeof ShippingRatesQuerySchema>;

    if (q.orderValue >= 499) {
      return res.json({
        success: true,
        data: {
          freeShipping: true,
          shippingCharge: 0,
          message: "Free delivery on this order!",
          estimatedDays: "3-5 business days",
        },
      });
    }

    const shippingCharge = await eshopboxService.calculateRate({ orderValue: q.orderValue });

    res.json({
      success: true,
      data: {
        freeShipping: false,
        shippingCharge,
        estimatedDays: "3-5 business days",
      },
    });
  })
);

/**
 * GET /api/v1/integrations/shipping/track/:orderId
 * Track shipment by your internal order ID (Eshopbox tracks by
 * customerOrderNumber, not AWB — see eshopbox.service.ts).
 */
router.get(
  "/shipping/track/:orderId",
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    if (!orderId) throw new AppError("Invalid order ID", 400);

    const tracking = await eshopboxService.trackByOrderId(orderId);
    res.json({ success: true, data: { tracking } });
  })
);

/**
 * POST /api/v1/integrations/shipping/create
 * Admin: hand an order off to Eshopbox for fulfillment.
 */
router.post(
  "/shipping/create",
  authenticate,
  requireRole(["admin", "super_admin", "order_manager"]),
  validate(ShippingCreateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.body as z.infer<typeof ShippingCreateSchema>;

    const order = await Order.findOne({ orderId })
      .populate("addressId")
      .populate("userId", "name email phone");
    if (!order) throw new AppError("Order not found", 404);

    const address = order.addressId as any;
    const user = order.userId as any;

    const { OrderItem } = await import("../database/models/OrderItem");
    const items = await OrderItem.find({ orderId: order._id });

    const ebOrder = await eshopboxService.createOrder({
      orderId: order.orderId,
      orderDate: order.createdAt.toISOString(),
      customer: {
        name: address.fullName,
        email: user.email || "",
        phone: address.phone,
        address: address.line1,
        address2: address.line2 || "",
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: "IN",
      },
      items: items.map((item) => ({
        name: item.productName,
        sku: item.sku,
        units: item.qty,
        selling_price: item.price,
      })),
      paymentMethod: order.paymentMethod === "cod" ? "COD" : "Prepaid",
      subTotal: order.subtotal,
      length: 20,
      breadth: 15,
      height: 10,
      weight: 0.5,
    });

    order.status = "confirmed";
    await order.save();

    await OrderTimeline.create({
      orderId: order._id,
      status: "confirmed",
      note: `Handed off to Eshopbox for fulfillment | Eshopbox order: ${ebOrder.eshopboxOrderId}`,
    });

    emitOrderUpdate({
      userId: String(order.userId),
      orderId: order.orderId,
      status: "confirmed",
      data: { eshopboxOrderId: ebOrder.eshopboxOrderId },
    });

    sendSMS(
      address.phone,
      `Hi ${user.name}! Your order ${order.orderId} has been confirmed and handed to our fulfillment partner.`
    ).catch(() => {});

    res.json({
      success: true,
      data: { eshopboxOrderId: ebOrder.eshopboxOrderId },
    });
  })
);

/**
 * POST /api/v1/integrations/shipping/pickup
 * NOT APPLICABLE with Eshopbox — pickup scheduling is entirely internal to
 * their fulfillment operation (see eshopbox.service.ts's schedulePickup()).
 * Route kept only to return a clear error instead of a 404, in case
 * anything still calls it.
 */
router.post(
  "/shipping/pickup",
  authenticate,
  requireRole(["admin", "super_admin", "order_manager", "warehouse"]),
  asyncHandler(async (_req: Request, _res: Response) => {
    throw new AppError(
      "Pickup scheduling is handled internally by Eshopbox — this endpoint is not applicable",
      501
    );
  })
);

/**
 * POST /api/v1/integrations/shipping/ndr
 * NOT APPLICABLE — Eshopbox handles non-delivery reports internally and
 * notifies via webhook rather than exposing an action endpoint. Kept only
 * to return a clear error.
 */
router.post(
  "/shipping/ndr",
  authenticate,
  requireRole(["admin", "super_admin", "order_manager"]),
  asyncHandler(async (_req: Request, _res: Response) => {
    throw new AppError("NDR actions are handled internally by Eshopbox — this endpoint is not applicable", 501);
  })
);

// ── Eshopbox Webhook ─────────────────────────────────────────────────────────

/**
 * POST /api/v1/integrations/shipping/webhook
 * Receives real-time status updates from Eshopbox.
 *
 * ⚠️ Field names/status values here are best-effort — Eshopbox's exact
 * webhook payload shape wasn't confirmed against their docs (see
 * eshopbox.service.ts's confidence-level notes). Verify against a real
 * webhook delivery from your workspace before relying on this in prod.
 */
router.post(
  "/shipping/webhook",
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;

    // Same fail-closed auth pattern as before: at least one of secret or IP
    // allowlist MUST be configured, or the endpoint refuses everything.
    const configuredSecret = process.env.ESHOPBOX_WEBHOOK_SECRET || "";
    const clientIP = ((req.headers["x-forwarded-for"] as string) || req.ip || "").split(",")[0].trim();

    if (!configuredSecret) {
      logger.error(
        "Eshopbox webhook rejected: ESHOPBOX_WEBHOOK_SECRET is not configured, " +
          "so this endpoint has no way to authenticate the caller."
      );
      return res.status(403).json({ error: "Webhook not configured" });
    }

    const providedSecret = (req.query.secret as string) || (req.headers["x-webhook-secret"] as string) || "";
    if (!providedSecret || !safeCompareString(configuredSecret, providedSecret)) {
      logger.warn(`Eshopbox webhook rejected: invalid or missing secret (IP ${clientIP})`);
      return res.status(403).json({ error: "Unauthorized" });
    }

    const event = eshopboxService.parseWebhook(body);
    logger.info(`Eshopbox webhook: order=${event.orderId} Status=${event.status}`);

    const STATUS_MAP: Record<string, string> = {
      CONFIRMED: "confirmed",
      "READY TO SHIP": "ready_for_pickup",
      SHIPPED: "shipped",
      "OUT FOR DELIVERY": "out_for_delivery",
      DELIVERED: "delivered",
      RTO: "returned",
      UNDELIVERED: "NDR",
      CANCELLED: "cancelled",
    };

    const internalStatus = STATUS_MAP[event.status.toUpperCase()];

    if (event.orderId && internalStatus) {
      const order = await Order.findOne({ orderId: event.orderId });

      if (order) {
        order.status = internalStatus as any;
        if (event.awb) order.trackingNo = event.awb;
        await order.save();

        await OrderTimeline.create({
          orderId: order._id,
          status: internalStatus,
          note: `Eshopbox update: ${event.status}${event.location ? ` at ${event.location}` : ""}`,
        });

        emitOrderUpdate({
          userId: String(order.userId),
          orderId: order.orderId,
          status: internalStatus,
          data: { location: event.location },
        });

        if (["out_for_delivery", "delivered"].includes(internalStatus)) {
          const user = await User.findById(order.userId).select("phone name");
          const msgs: Record<string, string> = {
            out_for_delivery: `Hi ${user?.name}! Your nityasamagri order ${order.orderId} is out for delivery. Expect it today! 🚚`,
            delivered: `Hi ${user?.name}! Your order ${order.orderId} has been delivered. 🙏 Thank you for shopping with nityasamagri!`,
          };
          if (user?.phone && msgs[internalStatus]) {
            sendSMS(user.phone, msgs[internalStatus]).catch(() => {});
          }
        }

        emitToAdmins({
          event: "ORDER_STATUS_UPDATE",
          payload: { orderId: order.orderId, status: internalStatus, location: event.location },
        });
      }
    }

    res.json({ status: "ok" });
  })
);

// ── Razorpay Utilities ────────────────────────────────────────────────────────

/**
 * GET /api/v1/integrations/payment/config/:orderId
 * Get Razorpay checkout config for frontend
 */
router.get(
  "/payment/config/:orderId",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const order = await Order.findOne({ orderId: req.params.orderId, userId: req.user!.userId }).populate(
      "userId",
      "name phone email"
    );

    if (!order) throw new AppError("Order not found", 404);
    if (order.paymentStatus === "paid") throw new AppError("Order already paid", 400);
    if (!order.razorpayOrderId) throw new AppError("Payment not initialized", 400);

    const user = order.userId as any;

    const config = razorpayService.getCheckoutConfig({
      orderId: order.razorpayOrderId,
      amount: order.total,
      name: user.name,
      phone: user.phone,
      email: user.email || "",
      orderRef: order.orderId,
    });

    res.json({ success: true, data: { config } });
  })
);

/**
 * GET /api/v1/integrations/payment/status/:paymentId
 * Check payment status from Razorpay
 */
router.get(
  "/payment/status/:paymentId",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const payment = await razorpayService.fetchPayment(req.params.paymentId);
    res.json({
      success: true,
      data: {
        status: payment.status,
        method: payment.method,
        amount: Number(payment.amount) / 100,
        captured: payment.captured,
      },
    });
  })
);

export default router;