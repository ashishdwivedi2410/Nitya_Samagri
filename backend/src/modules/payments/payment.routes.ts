// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS MODULE  ·  payment.routes.ts
// Razorpay order creation + webhook verification + refunds
// ─────────────────────────────────────────────────────────────────────────────
import { Router, Request, Response } from "express";
import Razorpay from "razorpay";
import crypto   from "crypto";
import { z }    from "zod";
import { Prisma }        from "@prisma/client";
import { prisma }        from "../../config/prisma";
import { AppError }      from "../../utils/AppError";
import { asyncHandler }  from "../../middlewares/async.middleware";
import { authenticate }  from "../../middlewares/auth.middleware";
import { requireRole }   from "../../middlewares/rbac.middleware";
import { validate }      from "../../middlewares/validate.middleware";
import { emitToUser, emitToAdmins } from "../../websocket/ws.server";
import { sendSMS }       from "../../integrations/twilio";

const router = Router();

// ── Timing-safe signature comparison ────────────────────────────────────────
// crypto.timingSafeEqual requires equal-length buffers, so we guard the
// length check first (a length mismatch is not itself sensitive information —
// Razorpay signatures are always fixed-length hex digests).
function safeCompare(expectedHex: string, actualHex: string): boolean {
  const expectedBuf = Buffer.from(expectedHex, "hex");
  const actualBuf    = Buffer.from(actualHex,   "hex");
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

// ── Razorpay client ───────────────────────────────────────────────────────────
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// ── Schemas ───────────────────────────────────────────────────────────────────
const CreatePaymentOrderSchema = z.object({
  orderId: z.string().min(1),  // nityasamagri order ID e.g. ORD-2026-1999
});

const VerifyPaymentSchema = z.object({
  razorpayOrderId:   z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
  orderId:           z.string(),
});

const RefundSchema = z.object({
  orderId: z.string(),
  amount:  z.number().positive().optional(), // partial refund support
  reason:  z.string().optional(),
  notes:   z.string().optional(),
});

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/payments/create-order
 * Create Razorpay order for a nityasamagri order
 * Called from checkout frontend before Razorpay SDK opens
 */
router.post("/create-order",
  authenticate,
  validate(CreatePaymentOrderSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.body;

    const order = await prisma.order.findFirst({
      where: { orderId, userId: req.user!.userId },
    });
    if (!order) throw new AppError("Order not found", 404);
    if (order.paymentStatus === "paid") throw new AppError("Order already paid", 400);

    // Create Razorpay order
    const rzpOrder = await razorpay.orders.create({
      amount:   order.total * 100, // paise
      currency: "INR",
      receipt:  order.orderId,
      notes:    {
        nityasamagri_order_id: order.orderId,
        customer_id:        order.userId,
      },
    });

    // Store Razorpay order ID against our order
    await prisma.order.update({
      where: { id: order.id },
      data:  { razorpayOrderId: rzpOrder.id },
    });

    res.json({
      success: true,
      data: {
        razorpayOrderId: rzpOrder.id,
        amount:          rzpOrder.amount,
        currency:        rzpOrder.currency,
        keyId:           process.env.RAZORPAY_KEY_ID,
        prefill: {
          // Populated from user profile on frontend
          name:    "",
          email:   "",
          contact: "",
        },
      },
    });
  })
);

/**
 * POST /api/v1/payments/verify
 * Verify Razorpay payment signature after checkout
 * Called from frontend after Razorpay SDK closes
 */
router.post("/verify",
  authenticate,
  validate(VerifyPaymentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

    // 1. Verify signature — this only proves razorpayOrderId+razorpayPaymentId
    //    is a genuine pair Razorpay signed for SOME payment. It says nothing
    //    about which of our internal orders should be marked paid — that
    //    binding is established explicitly in steps 3-5 below.
    const body      = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expected  = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (!safeCompare(expected, razorpaySignature)) {
      throw new AppError("Payment verification failed. Invalid signature.", 400);
    }

    // 2. Fetch the order — scoped to the authenticated user, so this can
    //    never be used to mark someone else's order as paid.
    const order = await prisma.order.findFirst({ where: { orderId, userId: req.user!.userId } });
    if (!order) throw new AppError("Order not found", 404);

    // 3. Idempotency: if this order was already verified (e.g. a retried
    //    request from a flaky network), don't reprocess or re-notify.
    if (order.paymentStatus === "paid") {
      return res.json({ success: true, message: "Payment already verified", data: { orderId: order.orderId } });
    }

    // 4. Bind the verified (razorpayOrderId, razorpayPaymentId) pair to THIS
    //    order specifically. Without this check, a signature obtained for a
    //    legitimately-paid order (e.g. a ₹1 order) could be replayed with a
    //    different `orderId` in the request body to mark an unrelated,
    //    unpaid order as paid for free — the signature alone never proves
    //    that link.
    if (order.razorpayOrderId !== razorpayOrderId) {
      throw new AppError("Payment does not match this order.", 400);
    }

    // 5. Fetch payment details from Razorpay and cross-check them against
    //    the order server-side — never trust amount/status from the client.
    const payment = await razorpay.payments.fetch(razorpayPaymentId);

    if (payment.order_id !== razorpayOrderId) {
      throw new AppError("Payment does not match this order.", 400);
    }
    if (Number(payment.amount) !== Math.round(order.total * 100)) {
      throw new AppError("Payment amount does not match order total.", 400);
    }
    if (payment.status !== "captured") {
      throw new AppError(`Payment has not been captured (status: ${payment.status}).`, 400);
    }

    // 6. All checks passed — update order payment status
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus:     "paid",
          status:            "confirmed",
          razorpayPaymentId,
          razorpaySignature,
          paidAt:            new Date(),
        },
      });

      await tx.paymentLog.create({
        data: {
          orderId:           order.id,
          razorpayOrderId,
          razorpayPaymentId,
          amount:            order.total,
          currency:          "INR",
          status:            "captured",
          method:            payment.method || "unknown",
          gateway:           "razorpay",
        },
      });

      await tx.orderTimeline.create({
        data: { orderId: order.id, status: "confirmed", note: `Payment of ₹${order.total} received via Razorpay` },
      });
    });

    // 7. Real-time notification to customer
    emitToUser(order.userId, {
      event:   "PAYMENT_SUCCESS",
      payload: { orderId: order.orderId, amount: order.total, timestamp: Date.now() },
    });

    // 8. Notify admins
    emitToAdmins({
      event:   "NEW_ORDER_ALERT",
      payload: { orderId: order.orderId, amount: order.total, status: "confirmed", paymentId: razorpayPaymentId },
    });

    // 9. SMS (non-blocking)
    const user = await prisma.user.findUnique({ where: { id: order.userId }, select: { phone: true, name: true } });
    if (user?.phone) {
      sendSMS(user.phone, `Payment of ₹${order.total} received for order ${order.orderId}. We're preparing your puja samagri! 🙏`).catch(() => {});
    }

    res.json({ success: true, message: "Payment verified successfully", data: { orderId: order.orderId } });
  })
);

/**
 * POST /api/v1/payments/webhook
 * Razorpay webhook for server-side payment events
 * Body is RAW (configured in app.ts)
 */
router.post("/webhook", asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers["x-razorpay-signature"] as string;
  const body      = req.body as Buffer;
  const secret    = process.env.RAZORPAY_WEBHOOK_SECRET!;

  // Verify webhook signature
  if (!signature) {
    throw new AppError("Invalid webhook signature", 400);
  }
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  if (!safeCompare(expected, signature)) {
    throw new AppError("Invalid webhook signature", 400);
  }

  const event = JSON.parse(body.toString()) as {
    event: string;
    payload: { payment?: { entity: Record<string, unknown> }; refund?: { entity: Record<string, unknown> } };
  };

  switch (event.event) {

    case "payment.captured": {
      const payment = event.payload.payment!.entity;
      const receipt = payment.description as string || payment.receipt as string;
      // Already handled in /verify — this is a fallback
      const order = await prisma.order.findFirst({ where: { orderId: receipt } });
      if (order && order.paymentStatus !== "paid") {
        await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "paid", status: "confirmed" } });
      }
      break;
    }

    case "payment.failed": {
      const payment  = event.payload.payment!.entity;
      const orderId  = payment.receipt as string;
      const order    = await prisma.order.findFirst({ where: { orderId } });
      if (order) {
        await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "failed" } });
        await prisma.paymentLog.create({
          data: {
            orderId:           order.id,
            razorpayOrderId:   payment.order_id as string,
            razorpayPaymentId: payment.id as string,
            amount:            order.total,
            currency:          "INR",
            status:            "failed",
            method:            payment.method as string || "unknown",
            gateway:           "razorpay",
            errorCode:         payment.error_code as string,
            errorDescription:  payment.error_description as string,
          },
        });
        emitToUser(order.userId, { event: "PAYMENT_FAILED", payload: { orderId: order.orderId } });
      }
      break;
    }

    case "refund.processed": {
      const refund  = event.payload.refund!.entity;
      const payId   = refund.payment_id as string;
      const log     = await prisma.paymentLog.findFirst({ where: { razorpayPaymentId: payId } });
      if (log) {
        await prisma.order.update({
          where: { id: log.orderId },
          data:  { paymentStatus: "refunded", status: "refunded" },
        });
      }
      break;
    }
  }

  res.json({ status: "ok" });
}));

/**
 * POST /api/v1/payments/refund
 * Admin: initiate a refund
 */
router.post("/refund",
  authenticate, requireRole(["admin","super_admin"]),
  validate(RefundSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId, amount, reason } = req.body as z.infer<typeof RefundSchema>;

    const order = await prisma.order.findFirst({
      where: { orderId },
      include: { paymentLogs: { where: { status: "captured" }, take: 1 } },
    });
    if (!order)                    throw new AppError("Order not found", 404);
    if (!order.razorpayPaymentId)  throw new AppError("No payment found for this order", 400);
    if (order.paymentStatus === "refunded") throw new AppError("Already refunded", 400);

    // Refunds accumulate across multiple partial-refund calls — check the
    // NEW total (what's already been refunded + this request) against
    // order.total, not just this single request in isolation. A 1-paisa
    // epsilon absorbs float rounding on repeated fractional-rupee amounts.
    const alreadyRefunded = order.refundAmount || 0;
    const thisRefund      = amount || order.total;
    const cumulativeAfter = alreadyRefunded + thisRefund;
    const EPSILON = 0.01;

    if (cumulativeAfter > order.total + EPSILON) {
      const maxAdditional = Math.max(0, order.total - alreadyRefunded);
      throw new AppError(
        `Refund would exceed order total. Already refunded ₹${alreadyRefunded.toFixed(2)} of ₹${order.total.toFixed(2)} — max additional refund is ₹${maxAdditional.toFixed(2)}.`,
        400
      );
    }

    const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
      amount: Math.round(thisRefund * 100),
      notes:  { reason: reason || "Refund initiated by admin", orderId },
    });

    // Persist with an atomic DB-level increment — never a plain overwrite —
    // so the stored total is always the true sum of every refund issued for
    // this order, even if two refund calls happen to race each other.
    await prisma.order.update({
      where: { id: order.id },
      data:  {
        paymentStatus: cumulativeAfter >= order.total - EPSILON ? "refunded" : "partially_refunded",
        status:        "refunded",
        refundId:      refund.id,
        refundedAt:    new Date(),
        refundAmount:  { increment: thisRefund },
      },
    });

    await prisma.orderTimeline.create({
      data: {
        orderId: order.id,
        status:  "refunded",
        note:    `Refund of ₹${thisRefund.toFixed(2)} initiated (₹${cumulativeAfter.toFixed(2)} of ₹${order.total.toFixed(2)} refunded to date). Refund ID: ${refund.id}`,
        adminId: req.user!.userId,
      },
    });

    emitToUser(order.userId, {
      event:   "PAYMENT_SUCCESS",
      payload: { orderId: order.orderId, refundAmount: thisRefund, message: "Refund initiated" },
    });

    res.json({ success: true, data: { refundId: refund.id, amount: thisRefund, totalRefunded: cumulativeAfter } });
  })
);

/**
 * GET /api/v1/payments/history
 * Customer: payment history
 */
router.get("/history", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    where:   { userId: req.user!.userId, paymentStatus: { not: "pending" } },
    select:  {
      orderId: true, total: true, paymentMethod: true,
      paymentStatus: true, paidAt: true, refundedAt: true, refundAmount: true,
    },
    orderBy: { createdAt: "desc" },
    take:    20,
  });
  res.json({ success: true, data: { payments: orders } });
}));

export default router;