// ─────────────────────────────────────────────────────────────────────────────
// ORDERS MODULE  ·  order.routes.ts
// ─────────────────────────────────────────────────────────────────────────────
import { Router, Request, Response } from "express";
import { z }   from "zod";
import { prisma }        from "../config/prisma";
import { AppError }      from "../utils/AppError";
import { asyncHandler }  from "../middlewares/async.middleware";
import { authenticate }  from "../middlewares/auth.middleware";
import { requireRole }   from "../middlewares/rbac.middleware";
import { validate }      from "../middlewares/validate.middleware";
import { paginate }      from "../utils/paginate";
import { emitOrderUpdate, emitToAdmins } from "../websocket/ws.server";
import { sendSMS }       from "../integrations/twilio";
import { sendEmail }     from "../integrations/sendgrid";

const router = Router();

// ── Schemas ───────────────────────────────────────────────────────────────────
const CreateOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional(),
    qty:       z.number().int().min(1),
    price:     z.number().positive(),
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

  // 2. Validate stock & lock products
  const productIds = data.items.map(i => i.productId);
  const products   = await prisma.product.findMany({ where: { id: { in: productIds } } });

  for (const item of data.items) {
    const product = products.find(p => p.id === item.productId);
    if (!product)           throw new AppError(`Product ${item.productId} not found`, 404);
    if (product.stock < item.qty) throw new AppError(`Insufficient stock for ${product.name}`, 400);
  }

  // 3. Calculate totals
  const subtotal  = data.items.reduce((s, i) => s + i.price * i.qty, 0);
  const gst       = data.items.reduce((s, i) => {
    const prod = products.find(p => p.id === i.productId)!;
    return s + (i.price * i.qty * (prod.gstPct || 5) / 100);
  }, 0);
  const shipping  = subtotal >= 499 ? 0 : 49;

  let discount  = 0;
  let couponId: string | undefined;
  if (data.couponCode) {
    const result = await applyCoupon(data.couponCode, subtotal);
    discount = result.discount;
    couponId = result.coupon.id;
  }

  const total = Math.round(subtotal + gst + shipping - discount);

  // 4. Create order in transaction
  const order = await prisma.$transaction(async (tx) => {
    // Decrement stock
    for (const item of data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data:  { stock: { decrement: item.qty } },
      });
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
        items:         { create: data.items.map(i => ({
          productId: i.productId,
          variantId: i.variantId,
          qty:       i.qty,
          price:     i.price,
          total:     i.price * i.qty,
        }))},
      },
      include: { items: { include: { product: { select: { name: true, sku: true } } } }, address: true },
    });
  });

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

  await prisma.$transaction(async (tx) => {
    // Restock items
    const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
    for (const item of items) {
      await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.qty } } });
    }
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

    const updated = await prisma.$transaction(async (tx) => {
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