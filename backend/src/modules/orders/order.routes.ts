// ─────────────────────────────────────────────────────────────────────────────
// ORDERS MODULE  ·  order.routes.ts
// Converted from Prisma/PostgreSQL to Mongoose/MongoDB. sendgrid → mail.ts.
// ─────────────────────────────────────────────────────────────────────────────
import { Router, Request, Response } from "express";
import { z } from "zod";
import mongoose, { ClientSession } from "mongoose";
import { Order } from "../../database/models/Order";
import { OrderItem } from "../../database/models/OrderItem";
import { OrderTimeline } from "../../database/models/OrderTimeline";
import { Address } from "../../database/models/Address";
import { Product } from "../../database/models/Product";
import { ProductVariant } from "../../database/models/ProductVariant";
import { Coupon } from "../../database/models/Coupon";
import { User } from "../../database/models/User";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../middlewares/async.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { paginate } from "../../utils/paginate";
import { emitOrderUpdate, emitToAdmins } from "../../websocket/ws.server";
import { sendSMS } from "../../integrations/twilio";
import { sendEmail } from "../../integrations/mail";
import { logger } from "../../utils/logger";

const router = Router();
const objectId = () => z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID");

// ── Schemas ───────────────────────────────────────────────────────────────────
const CreateOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: objectId(),
        variantId: objectId().optional(),
        qty: z.number().int().min(1),
      })
    )
    .min(1),
  addressId: objectId(),
  deliveryDate: z.string().datetime().optional(),
  deliverySlot: z.string().optional(),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(["razorpay", "upi", "cod", "card", "netbanking", "wallet"]),
  notes: z.string().max(500).optional(),
});

const UpdateStatusSchema = z.object({
  status: z.enum([
    "confirmed", "packed", "ready_for_pickup", "shipped", "out_for_delivery",
    "delivered", "cancelled", "returned", "refunded",
  ]),
  trackingNo: z.string().optional(),
  courierName: z.string().optional(),
  note: z.string().optional(),
});

const MyOrdersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  status: z.string().optional(),
});

const AdminOrdersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.string().optional(),
  payment: z.string().optional(),
  q: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed", packed: "Packed",
  ready_for_pickup: "Ready for Pickup", shipped: "Shipped",
  out_for_delivery: "Out for Delivery", delivered: "Delivered",
  cancelled: "Cancelled", returned: "Returned", refunded: "Refunded",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateOrderId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `ORD-${year}-${rand}`;
}
const MAX_ORDER_ID_ATTEMPTS = 5;
function isOrderIdCollision(err: unknown): boolean {
  return (err as { code?: number })?.code === 11000; // Mongo duplicate-key error
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

interface OrderConfirmationData {
  orderId: string; subtotal: number; gst: number; shipping: number; discount: number; total: number;
  items: { qty: number; price: number; productName: string }[];
  address: { name: string; line1: string; line2?: string; city: string; state: string; pin: string } | null;
}

function buildOrderConfirmationEmail(order: OrderConfirmationData, customerName: string): string {
  const rows = order.items
    .map(
      (i) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;">${escapeHtml(i.productName)}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${i.qty}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">₹${(i.price * i.qty).toFixed(2)}</td>
    </tr>`
    )
    .join("");

  const addr = order.address;
  const addressBlock = addr
    ? `${escapeHtml(addr.name)}<br>${escapeHtml(addr.line1)}${addr.line2 ? `, ${escapeHtml(addr.line2)}` : ""}<br>${escapeHtml(addr.city)}, ${escapeHtml(addr.state)} ${escapeHtml(addr.pin)}`
    : "";

  return `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#222;">
    <h2 style="color:#b45309;margin-bottom:4px;">Thank you for your order, ${escapeHtml(customerName)}!</h2>
    <p style="color:#555;">Your order <strong>${order.orderId}</strong> has been placed and is being processed.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <thead><tr>
        <th style="text-align:left;padding:8px 0;border-bottom:2px solid #b45309;">Item</th>
        <th style="text-align:center;padding:8px 0;border-bottom:2px solid #b45309;">Qty</th>
        <th style="text-align:right;padding:8px 0;border-bottom:2px solid #b45309;">Amount</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <table style="width:100%;margin-top:8px;font-size:14px;">
      <tr><td>Subtotal</td><td style="text-align:right;">₹${order.subtotal.toFixed(2)}</td></tr>
      <tr><td>GST</td><td style="text-align:right;">₹${order.gst.toFixed(2)}</td></tr>
      <tr><td>Shipping</td><td style="text-align:right;">₹${order.shipping.toFixed(2)}</td></tr>
      ${order.discount ? `<tr><td>Discount</td><td style="text-align:right;">-₹${order.discount.toFixed(2)}</td></tr>` : ""}
      <tr><td style="font-weight:bold;padding-top:8px;">Total</td><td style="text-align:right;font-weight:bold;padding-top:8px;">₹${order.total.toFixed(2)}</td></tr>
    </table>
    ${addressBlock ? `<p style="margin-top:16px;font-size:14px;"><strong>Shipping to</strong><br>${addressBlock}</p>` : ""}
    <p style="margin-top:24px;font-size:14px;color:#555;">
      You can track your order anytime at <a href="https://nityasamagri.in/orders" style="color:#b45309;">nityasamagri.in/orders</a>.
    </p>
  </div>`;
}

// Restock whatever an order's line items decremented at checkout.
async function restockOrderItems(orderId: mongoose.Types.ObjectId, session: ClientSession) {
  const items = await OrderItem.find({ orderId }).session(session);
  for (const item of items) {
    if (item.variantId) {
      await ProductVariant.updateOne({ _id: item.variantId }, { $inc: { stock: item.qty } }, { session });
    } else {
      await Product.updateOne({ _id: item.productId }, { $inc: { stock: item.qty } }, { session });
    }
  }
}

async function applyCoupon(code: string, subtotal: number, session: ClientSession) {
  const coupon = await Coupon.findOne({ code }).session(session);
  if (!coupon || !coupon.isActive) throw new AppError("Invalid coupon code", 400);
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new AppError("Coupon expired", 400);
  if (subtotal < coupon.minOrderValue) throw new AppError(`Minimum order ₹${coupon.minOrderValue} required`, 400);
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new AppError("Coupon usage limit reached", 400);

  let discount = 0;
  if (coupon.type === "percent") discount = Math.min(coupon.maxDiscount || Infinity, (subtotal * coupon.value) / 100);
  if (coupon.type === "flat") discount = coupon.value;

  return { coupon, discount: Math.round(discount) };
}

// ── Customer routes ───────────────────────────────────────────────────────────

/**
 * POST /api/v1/orders
 */
router.post(
  "/",
  authenticate,
  validate(CreateOrderSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const data = req.body as z.infer<typeof CreateOrderSchema>;

    const address = await Address.findOne({ _id: data.addressId, userId });
    if (!address) throw new AppError("Address not found", 404);

    const productIds = data.items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const variantIds = data.items.map((i) => i.variantId).filter(Boolean) as string[];
    const variants = variantIds.length ? await ProductVariant.find({ _id: { $in: variantIds } }) : [];

    const resolvedItems = data.items.map((item) => {
      const product = products.find((p) => String(p._id) === item.productId);
      if (!product) throw new AppError(`Product ${item.productId} not found`, 404);
      if (product.status !== "active") throw new AppError(`${product.name} is not available for purchase`, 400);

      if (item.variantId) {
        const variant = variants.find((v) => String(v._id) === item.variantId && v.isActive);
        if (!variant) throw new AppError(`Variant not found for ${product.name}`, 404);
        if (variant.stock < item.qty) throw new AppError(`Insufficient stock for ${product.name} (${variant.label})`, 400);
        return { ...item, product, price: variant.price, gstPct: product.gstPct || 5 };
      }

      if (product.stock < item.qty) throw new AppError(`Insufficient stock for ${product.name}`, 400);
      return { ...item, product, price: product.price, gstPct: product.gstPct || 5 };
    });

    const subtotal = resolvedItems.reduce((s, i) => s + i.price * i.qty, 0);
    const gst = resolvedItems.reduce((s, i) => s + (i.price * i.qty * i.gstPct) / 100, 0);
    const shipping = subtotal >= 499 ? 0 : 49;

    let order: InstanceType<typeof Order> | undefined;
    let createdItems: InstanceType<typeof OrderItem>[] = [];

    for (let attempt = 1; attempt <= MAX_ORDER_ID_ATTEMPTS; attempt++) {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          let discount = 0;
          let couponId: mongoose.Types.ObjectId | undefined;
          if (data.couponCode) {
            const result = await applyCoupon(data.couponCode, subtotal, session);
            discount = result.discount;
            couponId = result.coupon._id as mongoose.Types.ObjectId;
          }
          const total = Math.round(subtotal + gst + shipping - discount);

          // Atomic, conditional stock decrement — same guard as Prisma's
          // updateMany({ stock: { gte } }) so two concurrent checkouts
          // racing the last unit can't both succeed.
          for (const item of resolvedItems) {
            if (item.variantId) {
              const result = await ProductVariant.updateOne(
                { _id: item.variantId, stock: { $gte: item.qty } },
                { $inc: { stock: -item.qty } },
                { session }
              );
              if (result.modifiedCount === 0) {
                throw new AppError(`Insufficient stock for ${item.product.name} (variant) — please review your cart`, 409);
              }
            } else {
              const result = await Product.updateOne(
                { _id: item.productId, stock: { $gte: item.qty } },
                { $inc: { stock: -item.qty } },
                { session }
              );
              if (result.modifiedCount === 0) {
                throw new AppError(`Insufficient stock for ${item.product.name} — please review your cart`, 409);
              }
            }
          }

          if (couponId) {
            await Coupon.updateOne({ _id: couponId }, { $inc: { usedCount: 1 } }, { session });
          }

          const [createdOrder] = await Order.create(
            [
              {
                orderId: generateOrderId(),
                userId,
                addressId: data.addressId,
                address: {
                  name: address.fullName,
                  line1: address.line1,
                  line2: address.line2,
                  city: address.city,
                  state: address.state,
                  pin: address.pincode,
                },
                status: "pending",
                paymentMethod: data.paymentMethod,
                paymentStatus: "pending",
                subtotal: Math.round(subtotal),
                gst: Math.round(gst),
                shipping,
                discount,
                total,
                couponId,
                deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
                deliverySlot: data.deliverySlot,
                notes: data.notes,
              },
            ],
            { session }
          );

          order = createdOrder;

          createdItems = await OrderItem.create(
            resolvedItems.map((i) => ({
              orderId: order!._id,
              productId: i.productId,
              variantId: i.variantId,
              productName: i.product.name,
              sku: i.product.sku,
              qty: i.qty,
              price: i.price,
              total: i.price * i.qty,
              gstPct: i.gstPct,
            })),
            { session }
          );
        });
        await session.endSession();
        break; // success
      } catch (err) {
        await session.endSession();
        if (!isOrderIdCollision(err) || attempt === MAX_ORDER_ID_ATTEMPTS) throw err;
        // else: loop again — generateOrderId() will produce a fresh suffix
      }
    }

    if (!order) throw new AppError("Failed to create order — please try again", 500);

    emitToAdmins({
      event: "NEW_ORDER_ALERT",
      payload: { orderId: order.orderId, amount: order.total, customer: userId, timestamp: Date.now() },
    });

    const user = await User.findById(userId).select("phone name email");
    if (user?.phone) {
      sendSMS(
        user.phone,
        `Hi ${user.name}! Your nityasamagri order ${order.orderId} for ₹${order.total} has been placed. Track it at nityasamagri.in/orders`
      ).catch(() => {});
    }
    if (user?.email) {
      sendEmail({
        to: user.email,
        subject: `Order Confirmed — ${order.orderId}`,
        html: buildOrderConfirmationEmail(
          {
            orderId: order.orderId,
            subtotal: order.subtotal,
            gst: order.gst,
            shipping: order.shipping,
            discount: order.discount,
            total: order.total,
            items: createdItems.map((i) => ({ qty: i.qty, price: i.price, productName: i.productName })),
            address: order.address,
          },
          user.name
        ),
      }).catch((err) => logger.error(`Order confirmation email failed for ${order!.orderId}:`, err.message));
    }

    res.status(201).json({ success: true, data: { order: { ...order.toObject(), items: createdItems } } });
  })
);

/**
 * GET /api/v1/orders
 */
router.get(
  "/",
  authenticate,
  validate(MyOrdersQuerySchema, "query"),
  asyncHandler(async (req: Request, res: Response) => {
    const q = req.query as unknown as z.infer<typeof MyOrdersQuerySchema>;

    const filter: Record<string, unknown> = { userId: req.user!.userId };
    if (q.status) filter.status = q.status;

    const { skip, take } = paginate(q.page, q.limit);
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(take).lean(),
      Order.countDocuments(filter),
    ]);

    const orderIds = orders.map((o) => o._id);
    const items = await OrderItem.find({ orderId: { $in: orderIds } }).lean();
    const itemsByOrder = new Map<string, typeof items>();
    for (const it of items) {
      const key = String(it.orderId);
      if (!itemsByOrder.has(key)) itemsByOrder.set(key, []);
      itemsByOrder.get(key)!.push(it);
    }
    const ordersWithItems = orders.map((o) => ({ ...o, items: itemsByOrder.get(String(o._id)) || [] }));

    res.json({
      success: true,
      data: { orders: ordersWithItems, pagination: { page: q.page, limit: q.limit, total, pages: Math.ceil(total / q.limit) } },
    });
  })
);

/**
 * GET /api/v1/orders/:orderId
 */
router.get(
  "/:orderId",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const filter: Record<string, unknown> = { orderId: req.params.orderId };
    if (req.user!.role === "customer") filter.userId = req.user!.userId;

    const order = await Order.findOne(filter).populate("couponId", "code type value").populate("addressId").lean();
    if (!order) throw new AppError("Order not found", 404);

    const [items, timeline] = await Promise.all([
      OrderItem.find({ orderId: order._id }).populate("productId").populate("variantId").lean(),
      OrderTimeline.find({ orderId: order._id }).sort({ createdAt: 1 }).lean(),
    ]);

    res.json({ success: true, data: { order: { ...order, items, timeline } } });
  })
);

/**
 * POST /api/v1/orders/:orderId/cancel
 */
router.post(
  "/:orderId/cancel",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const order = await Order.findOne({ orderId: req.params.orderId, userId: req.user!.userId });
    if (!order) throw new AppError("Order not found", 404);
    if (["shipped", "out_for_delivery", "delivered"].includes(order.status)) {
      throw new AppError("Cannot cancel order after it has been shipped", 400);
    }
    if (order.status === "cancelled") throw new AppError("Order already cancelled", 400);

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await restockOrderItems(order._id as mongoose.Types.ObjectId, session);
        order.status = "cancelled";
        await order.save({ session });
        await OrderTimeline.create(
          [{ orderId: order._id, status: "cancelled", note: req.body.reason || "Cancelled by customer" }],
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    emitOrderUpdate({ userId: String(order.userId), orderId: order.orderId, status: "cancelled" });
    res.json({ success: true, message: "Order cancelled successfully" });
  })
);

// ── Admin routes ──────────────────────────────────────────────────────────────

/**
 * GET /api/v1/orders/admin/all
 */
router.get(
  "/admin/all",
  authenticate,
  requireRole(["admin", "super_admin", "order_manager"]),
  validate(AdminOrdersQuerySchema, "query"),
  asyncHandler(async (req: Request, res: Response) => {
    const q = req.query as unknown as z.infer<typeof AdminOrdersQuerySchema>;

    const filter: Record<string, unknown> = {};
    if (q.status) filter.status = q.status;
    if (q.payment) filter.paymentMethod = q.payment;
    if (q.q) {
      // "user.name"/"user.phone" search needs the matching user IDs first,
      // since Order only stores userId (no $lookup join at query time here).
      const matchingUsers = await User.find({
        $or: [{ name: { $regex: q.q, $options: "i" } }, { phone: { $regex: q.q } }],
      }).select("_id");
      filter.$or = [{ orderId: { $regex: q.q, $options: "i" } }, { userId: { $in: matchingUsers.map((u) => u._id) } }];
    }
    if (q.dateFrom || q.dateTo) {
      filter.createdAt = {};
      if (q.dateFrom) (filter.createdAt as Record<string, unknown>).$gte = new Date(q.dateFrom);
      if (q.dateTo) (filter.createdAt as Record<string, unknown>).$lte = new Date(q.dateTo);
    }

    const { skip, take } = paginate(q.page, q.limit);
    const [orders, total] = await Promise.all([
      Order.find(filter).populate("userId", "name phone").sort({ createdAt: -1 }).skip(skip).limit(take).lean(),
      Order.countDocuments(filter),
    ]);

    const orderIds = orders.map((o) => o._id);
    const items = await OrderItem.find({ orderId: { $in: orderIds } }).select("orderId productName qty price").lean();
    const itemsByOrder = new Map<string, typeof items>();
    for (const it of items) {
      const key = String(it.orderId);
      if (!itemsByOrder.has(key)) itemsByOrder.set(key, []);
      itemsByOrder.get(key)!.push(it);
    }
    const ordersWithItems = orders.map((o) => ({ ...o, items: itemsByOrder.get(String(o._id)) || [] }));

    res.json({
      success: true,
      data: { orders: ordersWithItems, pagination: { page: q.page, limit: q.limit, total, pages: Math.ceil(total / q.limit) } },
    });
  })
);

/**
 * PATCH /api/v1/orders/:orderId/status
 */
router.patch(
  "/:orderId/status",
  authenticate,
  requireRole(["admin", "super_admin", "order_manager", "warehouse"]),
  validate(UpdateStatusSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { status, trackingNo, courierName, note } = req.body as z.infer<typeof UpdateStatusSchema>;

    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) throw new AppError("Order not found", 404);

    const RESTOCK_STATUSES = ["cancelled", "returned"];
    const alreadyRestocked = RESTOCK_STATUSES.includes(order.status);
    const shouldRestock = RESTOCK_STATUSES.includes(status) && !alreadyRestocked;

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        if (shouldRestock) {
          await restockOrderItems(order._id as mongoose.Types.ObjectId, session);
        }

        order.status = status;
        if (trackingNo) order.trackingNo = trackingNo;
        if (courierName) order.courierName = courierName;
        await order.save({ session });

        await OrderTimeline.create(
          [{ orderId: order._id, status, note: note || `Status updated to ${ORDER_STATUS_LABELS[status]}` }],
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    emitOrderUpdate({ userId: String(order.userId), orderId: order.orderId, status, data: { trackingNo, courierName } });

    const user = await User.findById(order.userId).select("phone name");
    const smsTemplates: Record<string, string> = {
      confirmed: `Hi ${user?.name}! Your order ${order.orderId} has been confirmed. `,
      shipped: `Hi ${user?.name}! Your order ${order.orderId} has been shipped via ${courierName}. Track: ${trackingNo}`,
      out_for_delivery: `Hi ${user?.name}! Your order ${order.orderId} is out for delivery. Expect it today!`,
      delivered: `Hi ${user?.name}! Your order ${order.orderId} has been delivered. Thank you for shopping at nityasamagri! 🙏`,
    };
    if (user?.phone && smsTemplates[status]) {
      sendSMS(user.phone, smsTemplates[status]).catch(() => {});
    }

    res.json({ success: true, data: { order } });
  })
);

/**
 * GET /api/v1/orders/admin/stats
 */
router.get(
  "/admin/stats",
  authenticate,
  requireRole(["admin", "super_admin"]),
  asyncHandler(async (_req: Request, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

    const [totalOrders, todayOrders, monthRevenueAgg, statusCounts, paymentSplit, revenueTrend, topProducts, categoryPerf] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: monthStart }, paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Order.aggregate([{ $group: { _id: "$paymentMethod", count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo }, paymentStatus: "paid" } },
        { $group: { _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } }, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
        { $sort: { "_id.y": 1, "_id.m": 1 } },
      ]),
      OrderItem.aggregate([
        { $group: { _id: "$productId", name: { $first: "$productName" }, qtySold: { $sum: "$qty" }, revenue: { $sum: "$total" } } },
        { $sort: { qtySold: -1 } },
        { $limit: 10 },
      ]),
      OrderItem.aggregate([
        { $lookup: { from: "products", localField: "productId", foreignField: "_id", as: "product" } },
        { $unwind: "$product" },
        { $lookup: { from: "categories", localField: "product.categoryId", foreignField: "_id", as: "category" } },
        { $unwind: "$category" },
        { $group: { _id: "$category.name", revenue: { $sum: "$total" }, qtySold: { $sum: "$qty" } } },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        todayOrders,
        monthRevenue: monthRevenueAgg[0]?.total || 0,
        statusCounts: Object.fromEntries(statusCounts.map((s) => [s._id, s.count])),
        paymentSplit: Object.fromEntries(paymentSplit.map((p) => [p._id, p.count])),
        revenueTrend: revenueTrend.map((r) => ({ month: `${r._id.y}-${String(r._id.m).padStart(2, "0")}`, revenue: r.revenue, orders: r.orders })),
        topProducts,
        categoryPerf,
      },
    });
  })
);

export default router;