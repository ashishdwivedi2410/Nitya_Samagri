// src/modules/brands/brand.routes.ts
import { Router, Request, Response } from "express";
import { Brand } from "../../database/models/Brand";
import { asyncHandler } from "../../middlewares/async.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/rbac.middleware";
import { AppError } from "../../utils/AppError";

const router = Router();

// GET /api/v1/brands — public list of active brands.
router.get("/", asyncHandler(async (_req: Request, res: Response) => {
  const items = await Brand.find({ isActive: true }).sort({ name: 1 }).lean();
  res.json({ success: true, data: { items } });
}));

// POST /api/v1/brands — admin creates a brand (slug auto-generated).
router.post("/", authenticate, requireRole(["admin", "super_admin"]), asyncHandler(async (req: Request, res: Response) => {
  const { name, logoUrl } = req.body as { name?: string; logoUrl?: string };
  if (!name || name.trim().length < 2) throw new AppError("Brand name is required", 400);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const brand = await Brand.create({ name: name.trim(), slug, logoUrl });
  res.status(201).json({ success: true, data: { brand } });
}));

export default router;