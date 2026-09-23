// ─────────────────────────────────────────────────────────────────────────────
// ADDRESSES MODULE  ·  address.routes.ts
// All routes are authenticated and scoped to req.user.userId — a user can
// only ever see/edit/delete their own addresses. This is what apps/web's
// cart checkout (AddressStep → POST /orders addressId) was missing.
// ─────────────────────────────────────────────────────────────────────────────
import { Router, Request, Response } from "express";
import { z } from "zod";
import { Address } from "../../database/models/Address";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../middlewares/async.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";

const router = Router();
const objectId = () => z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID");

const AddressSchema = z.object({
  label: z.string().min(1).max(30).default("home"),
  fullName: z.string().min(2).max(100),
  phone: z.string().regex(/^\+91[6-9]\d{9}$/, "Phone must be in +91XXXXXXXXXX format"),
  line1: z.string().min(3).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  isDefault: z.boolean().optional(),
});
const AddressUpdateSchema = AddressSchema.partial();

router.use(authenticate);

/**
 * GET /api/v1/addresses
 * All addresses for the logged-in user, default first.
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const addresses = await Address.find({ userId: req.user!.userId }).sort({ isDefault: -1, createdAt: -1 }).lean();
    res.json({ success: true, data: { addresses } });
  })
);

/**
 * GET /api/v1/addresses/:id
 */
router.get(
  "/:id",
  validate(z.object({ id: objectId() }), "params"),
  asyncHandler(async (req: Request, res: Response) => {
    const address = await Address.findOne({ _id: req.params.id, userId: req.user!.userId }).lean();
    if (!address) throw new AppError("Address not found", 404);
    res.json({ success: true, data: { address } });
  })
);

/**
 * POST /api/v1/addresses
 * The first address a user ever adds is always made the default;
 * `isDefault: true` on any later address unsets it on the rest.
 */
router.post(
  "/",
  validate(AddressSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const existingCount = await Address.countDocuments({ userId });
    const makeDefault = req.body.isDefault === true || existingCount === 0;

    if (makeDefault) {
      await Address.updateMany({ userId }, { $set: { isDefault: false } });
    }

    const address = await Address.create({ ...req.body, userId, isDefault: makeDefault });
    res.status(201).json({ success: true, data: { address } });
  })
);

/**
 * PATCH /api/v1/addresses/:id
 */
router.patch(
  "/:id",
  validate(z.object({ id: objectId() }), "params"),
  validate(AddressUpdateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const address = await Address.findOne({ _id: req.params.id, userId });
    if (!address) throw new AppError("Address not found", 404);

    if (req.body.isDefault === true) {
      await Address.updateMany({ userId }, { $set: { isDefault: false } });
    }

    Object.assign(address, req.body);
    await address.save();

    res.json({ success: true, data: { address } });
  })
);

/**
 * DELETE /api/v1/addresses/:id
 * If the deleted address was the default, the next-most-recent address
 * (if any) is promoted to default so checkout always has one to fall back on.
 */
router.delete(
  "/:id",
  validate(z.object({ id: objectId() }), "params"),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const address = await Address.findOne({ _id: req.params.id, userId });
    if (!address) throw new AppError("Address not found", 404);

    const wasDefault = address.isDefault;
    await address.deleteOne();

    if (wasDefault) {
      const next = await Address.findOne({ userId }).sort({ createdAt: -1 });
      if (next) { next.isDefault = true; await next.save(); }
    }

    res.json({ success: true, data: { deleted: true } });
  })
);

export default router;