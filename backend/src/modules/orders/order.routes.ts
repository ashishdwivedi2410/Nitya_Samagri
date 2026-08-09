// ─────────────────────────────────────────────────────────────────────────────
// ORDERS MODULE  ·  order.routes.ts
// ─────────────────────────────────────────────────────────────────────────────
import { Router, Request, Response } from "express";
import { z }   from "zod";
import { Prisma }        from "@prisma/client";
import { prisma }        from "../../config/prisma";
import { AppError }      from "../../utils/AppError";
import { asyncHandler }  from "../../middlewares/async.middleware";
import { authenticate }  from "../../middlewares/auth.middleware";
import { requireRole }   from "../../middlewares/rbac.middleware";
import { validate }      from "../../middlewares/validate.middleware";
import { paginate }      from "../../utils/paginate";
import { emitOrderUpdate, emitToAdmins } from "../../websocket/ws.server";
import { sendSMS }       from "../../integrations/twilio";
import { sendEmail }     from "../../integrations/sendgrid";

const router = Router();

type PrismaTx = Prisma.TransactionClient;

// ── Schemas ───────────────────────────────────────────────────────────────────
const CreateOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional(),
    qty:       z.number().int().min(1),
    // NOTE: intentionally no `price` field — price is always looked up
    // server-side from the Product/ProductVariant record, never trusted
    // from the client. See order creation handler below.
  })).min(1),
  addressId:       z.string().uuid(),
  deliveryDate:    z.string().datetime().optional(),
  deliverySlot:    z.string().optional(),
  couponCode:      z.string().optional(),
  paymentMethod:   z.enum(["razorpay","upi","cod","card","netbanking","wallet"]),
  notes:           z.string().max(500).optional(),
});

const UpdateStatusSchema = z.object({
  status:  z.enum(["confirmed","packed","ready_for_pickup","shipped","out_for_delivery","delivered","cancelled","returned","refunded"]),
  trackingNo:   z.string().optional(),
  courierName:  z.string().optional(),
  note:         z.string().optional(),
});

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending:           "Pending",
  confirmed:         "Confirmed",
  packed:            "Packed",
  ready_for_pickup:  "Ready for Pickup",
  shipped:           "Shipped",
  out_for_delivery:  "Out for Delivery",
  delivered:         "Delivered",
  cancelled:         "Cancelled",
  returned:          "Returned",
  refunded:          "Refunded",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateOrderId(): string {
  const year  = new Date().getFullYear();
  const rand  = Math.floor(10000 + Math.random() * 90000);
  return `ORD-${year}-${rand}`;
}

// generateOrderId() has no uniqueness check before insert — a collision is
// rare but not impossible (90k possible suffixes per year). Order creation
// retries with a freshly generated ID on that specific failure, up to this
// many attempts, rather than surfacing a raw 500 to the customer.
const MAX_ORDER_ID_ATTEMPTS = 5;

function isOrderIdCollision(err: unknown): boolean {
  const e = err as { code?: string; meta?: { target?: unknown } };
  if (e?.code !== "P2002") return false;
  const target = e.meta?.target;
  return Array.isArray(target) ? target.includes("orderId") : String(target ?? "").includes("orderId");
}

// Restock whatever an order's line items actually decremented at checkout —
// the product's own stock for plain items, the specific variant's stock for
// variant items. Used on any transition into a terminal "items are back in
// the warehouse" state (customer cancel, admin cancel/return).
async function restockOrderItems(tx: PrismaTx, orderId: string) {
  const items = await tx.orderItem.findMany({ where: { orderId } });
  for (const item of items) {
    if (item.variantId) {
      await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.qty } } });
    } else {
      await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.qty } } });
    }
  }
}

async function applyCoupon(code: string, subtotal: number) {
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.isActive) throw new AppError("Invalid coupon code", 400);
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new AppError("Coupon expired", 400);
  if (subtotal < coupon.minOrderValue) throw new AppError(`Minimum order ₹${coupon.minOrderValue} required`, 400);
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new AppError("Coupon usage limit reached", 400);

  let discount = 0;
  if (coupon.type === "percent") discount = Math.min(coupon.maxDiscount || Infinity, subtotal * coupon.value / 100);
  if (coupon.type === "flat")    discount = coupon.value;

  return { coupon, discount: Math.round(discount) };
}

// ── Customer routes ───────────────────────────────────────────────────────────

/**
 * POST /api/v1/orders
 * Create a new order
 */
router.post("/", authenticate, validate(CreateOrderSchema), asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const data   = req.body as z.infer<typeof CreateOrderSchema>;

  // 1. Validate address belongs to user
  const address = await prisma.address.findFirst({ where: { id: data.addressId, userId } });
  if (!address) throw new AppError("Address not found", 404);

  // 2. Validate stock & resolve authoritative pricing from the DB
  const productIds = data.items.map(i => i.productId);
  const products    = await prisma.product.findMany({
    where:   { id: { in: productIds } },
    include: { variants: true },
  });

  // Resolve each line item against the DB — price and stock are NEVER taken
  // from the client, only productId/variantId/qty are trusted as references.
  const resolvedItems = data.items.map(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) throw new AppError(`Product ${item.productId} not found`, 404);
    if (product.status !== "active") throw new AppError(`${product.name} is not available for purchase`, 400);

    if (item.variantId) {
      const variant = product.variants.find(v => v.id === item.variantId && v.isActive);
      if (!variant) throw new AppError(`Variant not found for ${product.name}`, 404);
      if (variant.stock < item.qty) throw new AppError(`Insufficient stock for ${product.name} (${variant.label})`, 400);
      return { ...item, product, price: variant.price, gstPct: product.gstPct || 5 };
    }

    if (product.stock < item.qty) throw new AppError(`Insufficient stock for ${product.name}`, 400);
    return { ...item, product, price: product.price, gstPct: product.gstPct || 5 };
  });

  // 3. Calculate totals using server-resolved prices only
  const subtotal  = resolvedItems.reduce((s, i) => s + i.price * i.qty, 0);
  const gst       = resolvedItems.reduce((s, i) => s + (i.price * i.qty * i.gstPct / 100), 0);
  const shipping  = subtotal >= 499 ? 0 : 49;

  let discount  = 0;
  let couponId: string | undefined;
  if (data.couponCode) {
    const result = await applyCoupon(data.couponCode, subtotal);
    discount = result.discount;
    couponId = result.coupon.id;
  }

  const total = Math.round(subtotal + gst + shipping - discount);

  // 4. Create order in transaction. Retried (from scratch, including the
  // stock decrements) if — and only if — order creation fails specifically
  // because generateOrderId() collided with an existing order; any other
  // failure (e.g. the stock guard below) aborts immediately and propagates
  // as normal. Retrying the whole transaction is safe here: a collision
  // means the create() never committed, so nothing has actually decremented
  // yet on that attempt.
  let order;
  for (let attempt = 1; attempt <= MAX_ORDER_ID_ATTEMPTS; attempt++) {
    try {
      order = await prisma.$transaction(async (tx: PrismaTx) => {
        // Decrement stock (product or variant, matching what was validated above).
        // Use updateMany with a `stock >= qty` guard instead of a plain update —
        // this makes the decrement atomic and conditional at the DB level, so two
        // concurrent checkouts racing for the last unit can't both succeed and
        // drive stock negative. If the guard fails (someone else beat us to it),
        // count is 0 and we abort the whole transaction.
        for (const item of resolvedItems) {
          if (item.variantId) {
            const result = await tx.productVariant.updateMany({
              where: { id: item.variantId, stock: { gte: item.qty } },
              data:  { stock: { decrement: item.qty } },
            });
            if (result.count === 0) {
              throw new AppError(`Insufficient stock for ${item.product.name} (variant) — please review your cart`, 409);
            }
          } else {
            const result = await tx.product.updateMany({
              where: { id: item.productId, stock: { gte: item.qty } },
              data:  { stock: { decrement: item.qty } },
            });
            if (result.count === 0) {
              throw new AppError(`Insufficient stock for ${item.product.name} — please review your cart`, 409);
            }
          }
        }

        // Increment coupon usage
        if (couponId) {
          await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
        }

        // Create order
        return tx.order.create({
          data: {
            orderId:       generateOrderId(),
            userId,
            addressId:     data.addressId,
            status:        "pending",
            paymentMethod: data.paymentMethod,
            paymentStatus: "pending",
            subtotal:      Math.round(subtotal),
            gst:           Math.round(gst),
            shipping,
            discount,
            total,
            couponId,
            deliveryDate:  data.deliveryDate ? new Date(data.deliveryDate) : null,
            deliverySlot:  data.deliverySlot,
            notes:         data.notes,
            items:         { create: resolvedItems.map(i => ({
              productId: i.productId,
              variantId: i.variantId,
              qty:       i.qty,
              price:     i.price,       // server-resolved price, not client input
              total:     i.price * i.qty,
            }))},
          },
          include: { items: { include: { product: { select: { name: true, sku: true } } } }, address: true },
        });
      });
      break; // success
    } catch (err) {
      if (!isOrderIdCollision(err) || attempt === MAX_ORDER_ID_ATTEMPTS) throw err;
      // else: loop again — generateOrderId() will produce a fresh suffix
    }
  }

  // 5. Notify admin via WebSocket
  emitToAdmins({
    event:   "NEW_ORDER_ALERT",
    payload: { orderId: order.orderId, amount: order.total, customer: userId, timestamp: Date.now() },
  });

  // 6. Send confirmation SMS (non-blocking)
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { phone: true, name: true } });
  if (user?.phone) {
    sendSMS(user.phone, `Hi ${user.name}! Your nityasamagri order ${order.orderId} for ₹${order.total} has been placed. Track it at nityasamagri.com/orders`).catch(() => {});
  }

  res.status(201).json({ success: true, data: { order } });
}));

/**
 * GET /api/v1/orders
 * Get current user's orders
 */
router.get("/", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const q = z.object({
    page:   z.coerce.number().min(1).default(1),
    limit:  z.coerce.number().min(1).max(50).default(10),
    status: z.string().optional(),
  }).parse(req.query);

  const where: Record<string, unknown> = { userId: req.user!.userId };
  if (q.status) where.status = q.status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: { include: { product: { select: { name: true, slug: true } } } } },
      orderBy: { createdAt: "desc" },
      ...paginate(q.page, q.limit),
    }),
    prisma.order.count({ where }),
  ]);

  res.json({ success: true, data: { orders, pagination: { page: q.page, limit: q.limit, total, pages: Math.ceil(total / q.limit) } } });
}));

/**
 * GET /api/v1/orders/:orderId
 * Get single order detail
 */
router.get("/:orderId", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const order = await prisma.order.findFirst({
    where: {
      orderId: req.params.orderId,
      ...(req.user!.role === "customer" ? { userId: req.user!.userId } : {}),
    },
    include: {
      items:    { include: { product: true, variant: true } },
      address:  true,
      timeline: { orderBy: { createdAt: "asc" } },
      coupon:   { select: { code: true, type: true, value: true } },
    },
  });

  if (!order) throw new AppError("Order not found", 404);
  res.json({ success: true, data: { order } });
}));

/**
 * POST /api/v1/orders/:orderId/cancel
 * Customer cancels order (before shipped)
 */
router.post("/:orderId/cancel", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const order = await prisma.order.findFirst({
    where: { orderId: req.params.orderId, userId: req.user!.userId },
  });

  if (!order) throw new AppError("Order not found", 404);
  if (["shipped","out_for_delivery","delivered"].includes(order.status)) {
    throw new AppError("Cannot cancel order after it has been shipped", 400);
  }
  if (order.status === "cancelled") throw new AppError("Order already cancelled", 400);

  await prisma.$transaction(async (tx: PrismaTx) => {
    await restockOrderItems(tx, order.id);
    await tx.order.update({ where: { id: order.id }, data: { status: "cancelled" } });
    await tx.orderTimeline.create({
      data: { orderId: order.id, status: "cancelled", note: req.body.reason || "Cancelled by customer" },
    });
  });

  emitOrderUpdate({ userId: order.userId, orderId: order.orderId, status: "cancelled" });
  res.json({ success: true, message: "Order cancelled successfully" });
}));

// ── Admin routes ──────────────────────────────────────────────────────────────

/**
 * GET /api/v1/orders/admin/all
 * Admin: list all orders with filters
 */
router.get("/admin/all",
  authenticate, requireRole(["admin","super_admin","order_manager"]),
  asyncHandler(async (req: Request, res: Response) => {
    const q = z.object({
      page:      z.coerce.number().min(1).default(1),
      limit:     z.coerce.number().min(1).max(100).default(20),
      status:    z.string().optional(),
      payment:   z.string().optional(),
      q:         z.string().optional(),
      dateFrom:  z.string().optional(),
      dateTo:    z.string().optional(),
    }).parse(req.query);

    const where: Record<string, unknown> = {};
    if (q.status)  where.status        = q.status;
    if (q.payment) where.paymentMethod = q.payment;
    if (q.q) where.OR = [
      { orderId:  { contains: q.q } },
      { user:     { name:  { contains: q.q, mode: "insensitive" } } },
      { user:     { phone: { contains: q.q } } },
    ];
    if (q.dateFrom || q.dateTo) {
      where.createdAt = {};
      if (q.dateFrom) (where.createdAt as Record<string,unknown>).gte = new Date(q.dateFrom);
      if (q.dateTo)   (where.createdAt as Record<string,unknown>).lte = new Date(q.dateTo);
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user:  { select: { id: true, name: true, phone: true } },
          items: { include: { product: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        ...paginate(q.page, q.limit),
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ success: true, data: { orders, pagination: { page: q.page, limit: q.limit, total, pages: Math.ceil(total / q.limit) } } });
  })
);

/**
 * PATCH /api/v1/orders/:orderId/status
 * Admin: update order status + WebSocket broadcast
 */
router.patch("/:orderId/status",
  authenticate, requireRole(["admin","super_admin","order_manager","warehouse"]),
  validate(UpdateStatusSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { status, trackingNo, courierName, note } = req.body as z.infer<typeof UpdateStatusSchema>;

    const order = await prisma.order.findFirst({ where: { orderId: req.params.orderId } });
    if (!order) throw new AppError("Order not found", 404);

    // Restock only on the transition INTO cancelled/returned — never on an
    // order that's already in one of those states, so calling this twice
    // (or an admin cancelling an order the customer already cancelled)
    // can't restock the same items more than once.
    const RESTOCK_STATUSES = ["cancelled", "returned"];
    const alreadyRestocked = RESTOCK_STATUSES.includes(order.status);
    const shouldRestock    = RESTOCK_STATUSES.includes(status) && !alreadyRestocked;

    const updated = await prisma.$transaction(async (tx: PrismaTx) => {
      if (shouldRestock) {
        await restockOrderItems(tx, order.id);
      }

      const o = await tx.order.update({
        where: { id: order.id },
        data: {
          status,
          ...(trackingNo  && { trackingNo }),
          ...(courierName && { courierName }),
        },
      });
      await tx.orderTimeline.create({
        data: { orderId: order.id, status, note: note || `Status updated to ${ORDER_STATUS_LABELS[status]}`, adminId: req.user!.userId },
      });
      return o;
    });

    // Real-time update → customer
    emitOrderUpdate({ userId: order.userId, orderId: order.orderId, status, data: { trackingNo, courierName } });

    // SMS notification
    const user = await prisma.user.findUnique({ where: { id: order.userId }, select: { phone: true, name: true } });
    const smsTemplates: Record<string, string> = {
      confirmed:        `Hi ${user?.name}! Your order ${order.orderId} has been confirmed. `,
      shipped:          `Hi ${user?.name}! Your order ${order.orderId} has been shipped via ${courierName}. Track: ${trackingNo}`,
      out_for_delivery: `Hi ${user?.name}! Your order ${order.orderId} is out for delivery. Expect it today!`,
      delivered:        `Hi ${user?.name}! Your order ${order.orderId} has been delivered. Thank you for shopping at nityasamagri! 🙏`,
    };
    if (user?.phone && smsTemplates[status]) {
      sendSMS(user.phone, smsTemplates[status]).catch(() => {});
    }

    res.json({ success: true, data: { order: updated } });
  })
);

/**
 * GET /api/v1/orders/admin/stats
 * Admin: dashboard order statistics
 */
router.get("/admin/stats",
  authenticate, requireRole(["admin","super_admin"]),
  asyncHandler(async (_req: Request, res: Response) => {
    const today     = new Date(); today.setHours(0,0,0,0);
    const monthStart= new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalOrders, todayOrders, monthRevenue, statusCounts, paymentSplit] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.aggregate({ where: { createdAt: { gte: monthStart }, paymentStatus: "paid" }, _sum: { total: true } }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.order.groupBy({ by: ["paymentMethod"], _count: { _all: true } }),
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        todayOrders,
        monthRevenue:  monthRevenue._sum.total || 0,
        statusCounts:  Object.fromEntries(statusCounts.map(s => [s.status, s._count._all])),
        paymentSplit:  Object.fromEntries(paymentSplit.map(p => [p.paymentMethod, p._count._all])),
      },
    });
  })
);

export default router;