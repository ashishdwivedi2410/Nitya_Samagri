// ─────────────────────────────────────────────────────────────────────────────
// src/integrations/integrations.routes.ts
// Shipping rate check, Shiprocket webhook, Razorpay checkout config
// ─────────────────────────────────────────────────────────────────────────────

import { Router, Request, Response } from "express";
import crypto  from "crypto";
import { z }   from "zod";
import { prisma }             from "../config/prisma";
import { AppError }           from "../utils/AppError";
import { asyncHandler }       from "../middlewares/async.middleware";
import { authenticate }       from "../middlewares/auth.middleware";
import { requireRole }        from "../middlewares/rbac.middleware";
import { validate }           from "../middlewares/validate.middleware";
import { logger }             from "../utils/logger";
import { razorpayService }    from "./razorpay.service";
import { shiprocketService }  from "./shiprocket.service";
import { emitOrderUpdate, emitToAdmins } from "../websocket/ws.server";
import { sendSMS }            from "./twilio";

const router = Router();

function safeCompareString(expected: string, actual: string): boolean {
  const expectedBuf = Buffer.from(expected, "utf8");
  const actualBuf    = Buffer.from(actual,   "utf8");
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

// ── Schemas ───────────────────────────────────────────────────────────────────
const ShippingRatesQuerySchema = z.object({
  pincode:    z.string().regex(/^\d{6}$/, "Invalid pincode"),
  weight:     z.coerce.number().positive().default(0.5),
  orderValue: z.coerce.number().min(0).default(0),
  cod:        z.enum(["true","false"]).default("false").transform(v => v === "true"),
});

const ShippingCreateSchema = z.object({
  orderId:   z.string(),
  courierId: z.number().optional(),
});

const ShippingPickupSchema = z.object({
  shipmentIds: z.array(z.number()).min(1),
});

const ShippingNdrSchema = z.object({
  awb:           z.string(),
  action:        z.enum(["re-attempt","return"]),
  reattemptDate: z.string().optional(),
  remarks:       z.string().optional(),
});

// ── Shipping rate check (public) ──────────────────────────────────────────────

/**
 * GET /api/v1/integrations/shipping/rates?pincode=110070&weight=0.5&orderValue=599
 * Returns available couriers and rates for a delivery pincode
 */
router.get("/shipping/rates", validate(ShippingRatesQuerySchema, "query"), asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as z.infer<typeof ShippingRatesQuerySchema>;

  const pickupPincode = process.env.PICKUP_PINCODE || "160055"; // Mohali warehouse

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

  const couriers = await shiprocketService.getAvailableCouriers({
    pickupPincode,
    deliveryPincode: q.pincode,
    weight:          q.weight,
    cod:             q.cod,
  });

  const cheapest = couriers.sort((a, b) => a.rate - b.rate)[0];

  res.json({
    success: true,
    data: {
      freeShipping:    false,
      shippingCharge:  cheapest?.rate || 49,
      estimatedDays:   cheapest?.etd || "3-5 business days",
      availableCouriers: couriers.slice(0, 3),
    },
  });
}));

/**
 * GET /api/v1/integrations/shipping/track/:awb
 * Track shipment by AWB number
 */
router.get("/shipping/track/:awb", asyncHandler(async (req: Request, res: Response) => {
  const { awb } = req.params;
  if (!awb || awb.length < 5) throw new AppError("Invalid AWB number", 400);

  const tracking = await shiprocketService.trackByAWB(awb);
  res.json({ success: true, data: { tracking } });
}));

/**
 * POST /api/v1/integrations/shipping/create
 * Admin: create Shiprocket shipment for an order
 */
router.post("/shipping/create",
  authenticate, requireRole(["admin","super_admin","order_manager"]),
  validate(ShippingCreateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId, courierId } = req.body as z.infer<typeof ShippingCreateSchema>;

    const order = await prisma.order.findFirst({
      where:   { orderId },
      include: {
        items:   { include: { product: true, variant: true } },
        address: true,
        user:    { select: { name: true, email: true, phone: true } },
      },
    });
    if (!order) throw new AppError("Order not found", 404);

    // Build Shiprocket payload
    const srOrder = await shiprocketService.createOrder({
      orderId:       order.orderId,
      orderDate:     order.createdAt.toISOString(),
      customer: {
        name:    order.address.name,
        email:   order.user.email || "",
        phone:   order.address.phone,
        address: order.address.line1,
        address2: order.address.line2 || "",
        city:    order.address.city,
        state:   order.address.state,
        pincode: order.address.pin,
        country: order.address.country,
      },
      items: order.items.map(item => ({
        name:          item.product.name,
        sku:           item.product.sku,
        units:         item.qty,
        selling_price: item.price,
        hsn:           item.product.hsnCode ? parseInt(item.product.hsnCode) : 0,
      })),
      paymentMethod: order.paymentMethod === "cod" ? "COD" : "Prepaid",
      subTotal:      order.subtotal,
      length:        20,  // cm — could be per-product in future
      breadth:       15,
      height:        10,
      weight:        0.5, // kg — could be calculated from product weights
    });

    // Update order with AWB and courier
    await prisma.order.update({
      where: { id: order.id },
      data: {
        trackingNo:  srOrder.awb,
        courierName: srOrder.courierName,
        status:      "shipped",
      },
    });

    await prisma.orderTimeline.create({
      data: {
        orderId: order.id,
        status:  "shipped",
        note:    `Shipped via ${srOrder.courierName} | AWB: ${srOrder.awb}`,
        adminId: req.user!.userId,
      },
    });

    // Notify customer via WebSocket + SMS
    emitOrderUpdate({
      userId:  order.userId,
      orderId: order.orderId,
      status:  "shipped",
      data:    { trackingNo: srOrder.awb, courierName: srOrder.courierName },
    });

    sendSMS(
      order.address.phone,
      `Hi ${order.user.name}! Your order ${order.orderId} has been shipped via ${srOrder.courierName}. Track: ${srOrder.awb}`
    ).catch(() => {});

    res.json({
      success: true,
      data: {
        shiprocketOrderId: srOrder.shiprocketOrderId,
        awb:               srOrder.awb,
        courierName:       srOrder.courierName,
      },
    });
  })
);

/**
 * POST /api/v1/integrations/shipping/pickup
 * Admin: schedule pickup for shipments
 */
router.post("/shipping/pickup",
  authenticate, requireRole(["admin","super_admin","order_manager","warehouse"]),
  validate(ShippingPickupSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { shipmentIds } = req.body as z.infer<typeof ShippingPickupSchema>;

    const result = await shiprocketService.schedulePickup(shipmentIds);

    res.json({
      success: true,
      data:    { pickup: result },
      message: `Pickup scheduled for ${result.pickupDate} (${result.pickupSlot})`,
    });
  })
);

/**
 * POST /api/v1/integrations/shipping/ndr
 * Admin: handle Non-Delivery Report
 */
router.post("/shipping/ndr",
  authenticate, requireRole(["admin","super_admin","order_manager"]),
  validate(ShippingNdrSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { awb, action, reattemptDate, remarks } = req.body as z.infer<typeof ShippingNdrSchema>;

    await shiprocketService.handleNDR({ awb, action, reattemptDate, remarks });

    // Update order status to NDR
    const order = await prisma.order.findFirst({ where: { trackingNo: awb } });
    if (order) {
      await prisma.orderTimeline.create({
        data: {
          orderId: order.id,
          status:  "NDR",
          note:    `NDR action: ${action}${remarks ? ` — ${remarks}` : ""}`,
          adminId: req.user!.userId,
        },
      });
    }

    res.json({ success: true, message: `NDR action "${action}" applied for AWB ${awb}` });
  })
);

// ── Shiprocket Webhook ────────────────────────────────────────────────────────

/**
 * POST /api/v1/integrations/shipping/webhook
 * Receives real-time status updates from Shiprocket
 */
router.post("/shipping/webhook", asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;

  // Shiprocket doesn't sign its webhook payloads, so this endpoint has to
  // authenticate the caller itself. Two layers, both optional individually
  // but at least one is REQUIRED — if neither is configured we fail closed
  // (reject everything) rather than fail open (accept everything), which is
  // what happened before when SHIPROCKET_WEBHOOK_IPS was left unset.
  //
  // 1. Shared secret (primary, recommended) — set SHIPROCKET_WEBHOOK_SECRET
  //    and configure the Shiprocket webhook URL as
  //    .../shipping/webhook?secret=<the same value>. Unlike an IP check,
  //    this can't be bypassed by spoofing the X-Forwarded-For header, which
  //    this server doesn't currently validate against a trusted proxy chain.
  // 2. IP allowlist (optional, defense-in-depth) — SHIPROCKET_WEBHOOK_IPS,
  //    comma-separated. Enforced in addition to the secret if both are set.
  const configuredSecret = process.env.SHIPROCKET_WEBHOOK_SECRET || "";
  const allowedIPs = (process.env.SHIPROCKET_WEBHOOK_IPS || "")
    .split(",").map(ip => ip.trim()).filter(Boolean);
  const clientIP = (req.headers["x-forwarded-for"] as string || req.ip || "").split(",")[0].trim();

  if (!configuredSecret && allowedIPs.length === 0) {
    logger.error(
      "Shiprocket webhook rejected: neither SHIPROCKET_WEBHOOK_SECRET nor SHIPROCKET_WEBHOOK_IPS is configured, " +
      "so this endpoint has no way to authenticate the caller. Set at least SHIPROCKET_WEBHOOK_SECRET to enable it."
    );
    return res.status(403).json({ error: "Webhook not configured" });
  }

  if (configuredSecret) {
    const providedSecret = (req.query.secret as string) || (req.headers["x-webhook-secret"] as string) || "";
    if (!providedSecret || !safeCompareString(configuredSecret, providedSecret)) {
      logger.warn(`Shiprocket webhook rejected: invalid or missing secret (IP ${clientIP})`);
      return res.status(403).json({ error: "Unauthorized" });
    }
  }

  if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
    logger.warn(`Shiprocket webhook from unauthorized IP: ${clientIP}`);
    return res.status(403).json({ error: "Unauthorized" });
  }

  const event = shiprocketService.parseWebhook(body);
  logger.info(`Shiprocket webhook: AWB=${event.awb} Status=${event.status}`);

  // Status mapping from Shiprocket to internal statuses
  const STATUS_MAP: Record<string, string> = {
    "PICKUP SCHEDULED":    "confirmed",
    "PICKUP GENERATED":    "ready_for_pickup",
    "PICKED UP":           "shipped",
    "IN TRANSIT":          "shipped",
    "OUT FOR DELIVERY":    "out_for_delivery",
    "DELIVERED":           "delivered",
    "RTO INITIATED":       "returned",
    "RTO DELIVERED":       "returned",
    "UNDELIVERED":         "NDR",
    "LOST":                "cancelled",
  };

  const internalStatus = STATUS_MAP[event.status.toUpperCase()];

  if (event.awb && internalStatus) {
    const order = await prisma.order.findFirst({ where: { trackingNo: event.awb } });

    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data:  { status: internalStatus as any },
      });

      await prisma.orderTimeline.create({
        data: {
          orderId: order.id,
          status:  internalStatus,
          note:    `Shiprocket update: ${event.status}${event.location ? ` at ${event.location}` : ""}`,
        },
      });

      // Real-time update to customer
      emitOrderUpdate({
        userId:  order.userId,
        orderId: order.orderId,
        status:  internalStatus,
        data:    { location: event.location },
      });

      // SMS for key milestones
      if (["out_for_delivery","delivered"].includes(internalStatus)) {
        const user = await prisma.user.findUnique({
          where:  { id: order.userId },
          select: { phone: true, name: true },
        });
        const msgs: Record<string, string> = {
          out_for_delivery: `Hi ${user?.name}! Your nityasamagri order ${order.orderId} is out for delivery. Expect it today! 🚚`,
          delivered:        `Hi ${user?.name}! Your order ${order.orderId} has been delivered. 🙏 Thank you for shopping with nityasamagri!`,
        };
        if (user?.phone && msgs[internalStatus]) {
          sendSMS(user.phone, msgs[internalStatus]).catch(() => {});
        }
      }

      emitToAdmins({
        event:   "ORDER_STATUS_UPDATE",
        payload: { orderId: order.orderId, awb: event.awb, status: internalStatus, location: event.location },
      });
    }
  }

  res.json({ status: "ok" });
}));

// ── Razorpay Utilities ────────────────────────────────────────────────────────

/**
 * GET /api/v1/integrations/payment/config/:orderId
 * Get Razorpay checkout config for frontend
 */
router.get("/payment/config/:orderId",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const order = await prisma.order.findFirst({
      where:   { orderId: req.params.orderId, userId: req.user!.userId },
      include: { user: { select: { name: true, phone: true, email: true } } },
    });

    if (!order) throw new AppError("Order not found", 404);
    if (order.paymentStatus === "paid") throw new AppError("Order already paid", 400);
    if (!order.razorpayOrderId) throw new AppError("Payment not initialized", 400);

    const config = razorpayService.getCheckoutConfig({
      orderId:  order.razorpayOrderId,
      amount:   order.total,
      name:     order.user.name,
      phone:    order.user.phone,
      email:    order.user.email || "",
      orderRef: order.orderId,
    });

    res.json({ success: true, data: { config } });
  })
);

/**
 * GET /api/v1/integrations/payment/status/:paymentId
 * Check payment status from Razorpay
 */
router.get("/payment/status/:paymentId",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const payment = await razorpayService.fetchPayment(req.params.paymentId);
    res.json({
      success: true,
      data: {
        status:   payment.status,
        method:   payment.method,
        amount:   Number(payment.amount) / 100,
        captured: payment.captured,
      },
    });
  })
);

export default router;