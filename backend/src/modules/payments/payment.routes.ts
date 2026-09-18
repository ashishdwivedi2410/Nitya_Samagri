// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS MODULE  ·  payment.routes.ts
// Razorpay order creation + webhook verification + refunds
// Converted from Prisma/PostgreSQL to Mongoose/MongoDB.
// ─────────────────────────────────────────────────────────────────────────────
import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Order } from "../../database/models/Order";
import { PaymentLog } from "../../database/models/PaymentLog";
import { OrderTimeline } from "../../database/models/OrderTimeline";
import { User } from "../../database/models/User";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../middlewares/async.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { emitToUser, emitToAdmins } from "../../websocket/ws.server";
import { sendSMS } from "../../integrations/twilio";
import { razorpayService } from "../../integrations/razorpay.service";
import { env } from "../../config/env";

const router = Router();

// ── Schemas ───────────────────────────────────────────────────────────────────
const CreatePaymentOrderSchema = z.object({
  orderId: z.string().min(1),
});

const VerifyPaymentSchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
  orderId: z.string(),
});

const RefundSchema = z.object({
  orderId: z.string(),
  amount: z.number().positive().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/payments/create-order
 */
router.post(
  "/create-order",
  authenticate,
  validate(CreatePaymentOrderSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.body;

    const order = await Order.findOne({ orderId, userId: req.user!.userId });
    if (!order) throw new AppError("Order not found", 404);
    if (order.paymentStatus === "paid") throw new AppError("Order already paid", 400);

    const rzpOrder = await razorpayService.createOrder({
      amount: order.total,
      receipt: order.orderId,
      notes: {
        orderId: order.orderId,
        customerId: String(order.userId),
        type: "product",
      },
    });

    order.razorpayOrderId = rzpOrder.id;
    await order.save();

    res.json({
      success: true,
      data: {
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId: env.RAZORPAY_KEY_ID,
        prefill: { name: "", email: "", contact: "" },
      },
    });
  })
);

/**
 * POST /api/v1/payments/verify
 */
router.post(
  "/verify",
  authenticate,
  validate(VerifyPaymentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

    if (!razorpayService.verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature })) {
      throw new AppError("Payment verification failed. Invalid signature.", 400);
    }

    const order = await Order.findOne({ orderId, userId: req.user!.userId });
    if (!order) throw new AppError("Order not found", 404);

    if (order.paymentStatus === "paid") {
      return res.json({ success: true, message: "Payment already verified", data: { orderId: order.orderId } });
    }

    if (order.razorpayOrderId !== razorpayOrderId) {
      throw new AppError("Payment does not match this order.", 400);
    }

    const payment = await razorpayService.fetchPayment(razorpayPaymentId);

    if (payment.order_id !== razorpayOrderId) {
      throw new AppError("Payment does not match this order.", 400);
    }
    if (Number(payment.amount) !== Math.round(order.total * 100)) {
      throw new AppError("Payment amount does not match order total.", 400);
    }
    if (payment.status !== "captured") {
      throw new AppError(`Payment has not been captured (status: ${payment.status}).`, 400);
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        order.paymentStatus = "paid";
        order.status = "confirmed";
        order.razorpayPaymentId = razorpayPaymentId;
        order.razorpaySignature = razorpaySignature;
        order.paidAt = new Date();
        await order.save({ session });

        await PaymentLog.create(
          [
            {
              orderId: order._id,
              razorpayOrderId,
              razorpayPaymentId,
              amount: order.total,
              currency: "INR",
              status: "captured",
              method: payment.method || "unknown",
              gateway: "razorpay",
            },
          ],
          { session }
        );

        await OrderTimeline.create(
          [{ orderId: order._id, status: "confirmed", note: `Payment of ₹${order.total} received via Razorpay` }],
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    emitToUser(String(order.userId), {
      event: "PAYMENT_SUCCESS",
      payload: { orderId: order.orderId, amount: order.total, timestamp: Date.now() },
    });

    emitToAdmins({
      event: "NEW_ORDER_ALERT",
      payload: { orderId: order.orderId, amount: order.total, status: "confirmed", paymentId: razorpayPaymentId },
    });

    const user = await User.findById(order.userId).select("phone name");
    if (user?.phone) {
      sendSMS(
        user.phone,
        `Payment of ₹${order.total} received for order ${order.orderId}. We're preparing your puja samagri! 🙏`
      ).catch(() => {});
    }

    res.json({ success: true, message: "Payment verified successfully", data: { orderId: order.orderId } });
  })
);

/**
 * POST /api/v1/payments/webhook
 * Body is RAW (configured in app.ts)
 */
router.post(
  "/webhook",
  asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers["x-razorpay-signature"] as string;
    const body = req.body as Buffer;

    if (!signature || !razorpayService.verifyWebhookSignature(body, signature)) {
      throw new AppError("Invalid webhook signature", 400);
    }

    const event = razorpayService.parseWebhookEvent(body);

    switch (event.event) {
      case "payment.captured": {
        const payment = event.payload.payment!.entity;
        const receipt = (payment.description as string) || (payment.receipt as string);
        const order = await Order.findOne({ orderId: receipt });
        if (order && order.paymentStatus !== "paid") {
          order.paymentStatus = "paid";
          order.status = "confirmed";
          await order.save();
        }
        break;
      }

      case "payment.failed": {
        const payment = event.payload.payment!.entity;
        const orderId = payment.receipt as string;
        const order = await Order.findOne({ orderId });
        if (order) {
          order.paymentStatus = "failed";
          await order.save();

          await PaymentLog.create({
            orderId: order._id,
            razorpayOrderId: payment.order_id as string,
            razorpayPaymentId: payment.id as string,
            amount: order.total,
            currency: "INR",
            status: "failed",
            method: (payment.method as string) || "unknown",
            gateway: "razorpay",
            errorCode: payment.error_code as string,
            errorDescription: payment.error_description as string,
          });
          emitToUser(String(order.userId), { event: "PAYMENT_FAILED", payload: { orderId: order.orderId } });
        }
        break;
      }

      case "refund.processed": {
        const refund = event.payload.refund!.entity;
        const payId = refund.payment_id as string;
        const log = await PaymentLog.findOne({ razorpayPaymentId: payId });
        if (log) {
          await Order.findByIdAndUpdate(log.orderId, { paymentStatus: "refunded", status: "refunded" });
        }
        break;
      }
    }

    res.json({ status: "ok" });
  })
);

/**
 * POST /api/v1/payments/refund
 * Admin: initiate a refund
 */
router.post(
  "/refund",
  authenticate,
  requireRole(["admin", "super_admin"]),
  validate(RefundSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId, amount, reason } = req.body as z.infer<typeof RefundSchema>;

    const order = await Order.findOne({ orderId });
    if (!order) throw new AppError("Order not found", 404);
    if (!order.razorpayPaymentId) throw new AppError("No payment found for this order", 400);
    if (order.paymentStatus === "refunded") throw new AppError("Already refunded", 400);

    const alreadyRefunded = order.refundAmount || 0;
    const thisRefund = amount || order.total;
    const cumulativeAfter = alreadyRefunded + thisRefund;
    const EPSILON = 0.01;

    if (cumulativeAfter > order.total + EPSILON) {
      const maxAdditional = Math.max(0, order.total - alreadyRefunded);
      throw new AppError(
        `Refund would exceed order total. Already refunded ₹${alreadyRefunded.toFixed(2)} of ₹${order.total.toFixed(2)} — max additional refund is ₹${maxAdditional.toFixed(2)}.`,
        400
      );
    }

    const refund = await razorpayService.initiateRefund({
      paymentId: order.razorpayPaymentId,
      amount: thisRefund,
      reason: reason || "Refund initiated by admin",
      referenceId: orderId,
    });

    // Atomic DB-level increment, same guarantee as Prisma's { increment }
    const updated = await Order.findByIdAndUpdate(
      order._id,
      {
        $set: {
          paymentStatus: cumulativeAfter >= order.total - EPSILON ? "refunded" : "partially_refunded",
          status: "refunded",
          refundId: refund.id,
          refundedAt: new Date(),
        },
        $inc: { refundAmount: thisRefund },
      },
      { new: true }
    );

    await OrderTimeline.create({
      orderId: order._id,
      status: "refunded",
      note: `Refund of ₹${thisRefund.toFixed(2)} initiated (₹${cumulativeAfter.toFixed(2)} of ₹${order.total.toFixed(2)} refunded to date). Refund ID: ${refund.id}`,
    });

    emitToUser(String(order.userId), {
      event: "PAYMENT_SUCCESS",
      payload: { orderId: order.orderId, refundAmount: thisRefund, message: "Refund initiated" },
    });

    res.json({
      success: true,
      data: { refundId: refund.id, amount: thisRefund, totalRefunded: updated!.refundAmount },
    });
  })
);

/**
 * GET /api/v1/payments/history
 */
router.get(
  "/history",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const orders = await Order.find({ userId: req.user!.userId, paymentStatus: { $ne: "pending" } })
      .select("orderId total paymentMethod paymentStatus paidAt refundedAt refundAmount")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json({ success: true, data: { payments: orders } });
  })
);

export default router;