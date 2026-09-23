// src/modules/coupons/coupon.routes.ts — CRUD for Coupon (model existed, routes were missing)
import { Router, Request, Response } from "express";
import { z } from "zod";
import { Coupon } from "../../database/models/Coupon";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../middlewares/async.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { paginate } from "../../utils/paginate";

const router = Router();
const ADMIN = ["admin", "super_admin"];

const CouponSchema = z.object({
  code: z.string().min(3).max(30),
  type: z.enum(["percent", "flat"]),
  value: z.number().positive(),
  maxDiscount: z.number().positive().optional(),
  minOrderValue: z.number().min(0).default(0),
  usageLimit: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
  expiresAt: z.string().datetime().optional(),
});

router.get("/", authenticate, requireRole(ADMIN), asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1, limit = Number(req.query.limit) || 20;
  const { skip, take } = paginate(page, limit);
  const [coupons, total] = await Promise.all([
    Coupon.find().sort({ createdAt: -1 }).skip(skip).limit(take).lean(),
    Coupon.countDocuments(),
  ]);
  const stats = {
    active: await Coupon.countDocuments({ isActive: true }),
    totalUsed: (await Coupon.aggregate([{ $group: { _id: null, s: { $sum: "$usedCount" } } }]))[0]?.s || 0,
  };
  res.json({ success: true, data: { coupons, stats, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
}));

router.post("/", authenticate, requireRole(ADMIN), validate(CouponSchema), asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as z.infer<typeof CouponSchema>;
  const existing = await Coupon.findOne({ code: data.code.toUpperCase() });
  if (existing) throw new AppError("Coupon code already exists", 409);
  const coupon = await Coupon.create({ ...data, code: data.code.toUpperCase() });
  res.status(201).json({ success: true, data: { coupon } });
}));

router.patch("/:id", authenticate, requireRole(ADMIN), validate(CouponSchema.partial()), asyncHandler(async (req: Request, res: Response) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!coupon) throw new AppError("Coupon not found", 404);
  res.json({ success: true, data: { coupon } });
}));

router.delete("/:id", authenticate, requireRole(ADMIN), asyncHandler(async (req: Request, res: Response) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw new AppError("Coupon not found", 404);
  res.json({ success: true, message: "Coupon deleted" });
}));

export default router;