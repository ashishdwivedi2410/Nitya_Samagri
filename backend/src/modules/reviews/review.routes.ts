// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS MODULE  ·  review.routes.ts
// The Review model already existed (database/models/Review.ts) and was read
// from inside GET /products/:slug, but nothing ever wrote to it or listed a
// user's own reviews — that's what this module adds.
// ─────────────────────────────────────────────────────────────────────────────
import { Router, Request, Response } from "express";
import { z } from "zod";
import { Review } from "../../database/models/Review";
import { Order } from "../../database/models/Order";
import { OrderItem } from "../../database/models/OrderItem";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../middlewares/async.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";

const router = Router();
const objectId = () => z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID");

const ReviewCreateSchema = z.object({
  productId: objectId(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  comment: z.string().max(2000).optional(),
});
const ReviewUpdateSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(120).optional(),
  comment: z.string().max(2000).optional(),
});

/**
 * GET /api/v1/reviews?productId=... (public)
 * Approved reviews for a product — same filter GET /products/:slug already
 * uses internally, exposed here as its own paginated endpoint.
 */
router.get(
  "/",
  validate(z.object({ productId: objectId() }), "query"),
  asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.query as unknown as { productId: string };
    const reviews = await Review.find({ productId, isApproved: true })
      .sort({ createdAt: -1 })
      .populate("userId", "name")
      .lean();
    res.json({ success: true, data: { reviews } });
  })
);

router.use(authenticate);

/**
 * GET /api/v1/reviews/mine
 * The logged-in user's own submitted reviews (any approval state).
 */
router.get(
  "/mine",
  asyncHandler(async (req: Request, res: Response) => {
    const reviews = await Review.find({ userId: req.user!.userId })
      .sort({ createdAt: -1 })
      .populate("productId", "name slug")
      .lean();
    res.json({ success: true, data: { reviews } });
  })
);

/**
 * GET /api/v1/reviews/pending
 * Delivered order items the user hasn't reviewed yet — powers the "Pending"
 * tab on the reviews page.
 */
router.get(
  "/pending",
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const deliveredOrders = await Order.find({ userId, status: "delivered" }).select("_id orderId updatedAt").lean();
    const orderIds = deliveredOrders.map((o) => o._id);
    const items = await OrderItem.find({ orderId: { $in: orderIds } }).populate("productId", "name slug").lean();

    const reviewed = await Review.find({ userId, productId: { $ne: null } }).select("productId").lean();
    const reviewedIds = new Set(reviewed.map((r) => String(r.productId)));

    const orderById = new Map(deliveredOrders.map((o) => [String(o._id), o]));
    const seen = new Set<string>();
    const pending = items
      .filter((it) => it.productId && !reviewedIds.has(String((it.productId as any)._id)))
      .filter((it) => {
        const key = String((it.productId as any)._id);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((it) => {
        const order = orderById.get(String(it.orderId));
        return {
          productId: (it.productId as any)._id,
          productSlug: (it.productId as any).slug,
          name: it.productName,
          orderId: order?.orderId,
          deliveredOn: order?.updatedAt,
        };
      });

    res.json({ success: true, data: { pending } });
  })
);

/**
 * POST /api/v1/reviews
 * One review per user per product. Auto-approved: this codebase has no
 * admin moderation-queue endpoint, so defaulting to isApproved: false (the
 * Review model's default) would make every new review permanently
 * invisible with no way to publish it.
 */
router.post(
  "/",
  validate(ReviewCreateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { productId, rating, title, comment } = req.body;

    const existing = await Review.findOne({ userId, productId });
    if (existing) throw new AppError("You've already reviewed this product", 409);

    const purchase = await OrderItem.findOne({ productId }).populate({
      path: "orderId",
      match: { userId, status: "delivered" },
    });
    const isVerifiedPurchase = !!purchase?.orderId;

    const review = await Review.create({
      userId, productId, rating, title, comment,
      isVerifiedPurchase,
      isApproved: true,
    });
    res.status(201).json({ success: true, data: { review } });
  })
);

/**
 * PATCH /api/v1/reviews/:id
 */
router.patch(
  "/:id",
  validate(z.object({ id: objectId() }), "params"),
  validate(ReviewUpdateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const review = await Review.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!review) throw new AppError("Review not found", 404);
    Object.assign(review, req.body);
    await review.save();
    res.json({ success: true, data: { review } });
  })
);

/**
 * DELETE /api/v1/reviews/:id
 */
router.delete(
  "/:id",
  validate(z.object({ id: objectId() }), "params"),
  asyncHandler(async (req: Request, res: Response) => {
    const review = await Review.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!review) throw new AppError("Review not found", 404);
    await review.deleteOne();
    res.json({ success: true, data: { deleted: true } });
  })
);

export default router;