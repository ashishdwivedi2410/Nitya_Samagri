// src/modules/cms/cms.routes.ts — generic CRUD for all 6 CMS content types
import { Router, Request, Response } from "express";
import { Banner, Festival, Blog, Section, Announcement, SeoPage } from "../../database/models/CmsContent";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../middlewares/async.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/rbac.middleware";

const router = Router();
const ADMIN = ["admin", "super_admin"];
const MODELS = { banners: Banner, festivals: Festival, blogs: Blog, sections: Section, announcements: Announcement, "seo-pages": SeoPage } as const;
type Key = keyof typeof MODELS;

function modelFor(key: string) {
  const m = MODELS[key as Key];
  if (!m) throw new AppError(`Unknown CMS resource: ${key}`, 404);
  return m;
}

// Public read — storefront pulls active content
router.get("/:resource", asyncHandler(async (req: Request, res: Response) => {
  const M = modelFor(req.params.resource);
  const filter = req.query.all === "1" ? {} : { isActive: true };
  const items = await M.find(filter as Record<string, unknown>).sort({ sortOrder: 1, createdAt: -1 }).lean();
  res.json({ success: true, data: { items } });
}));

router.post("/:resource", authenticate, requireRole(ADMIN), asyncHandler(async (req: Request, res: Response) => {
  const M = modelFor(req.params.resource);
  const item = await M.create(req.body);
  res.status(201).json({ success: true, data: { item } });
}));

router.patch("/:resource/:id", authenticate, requireRole(ADMIN), asyncHandler(async (req: Request, res: Response) => {
  const M = modelFor(req.params.resource);
  const item = await M.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!item) throw new AppError("Not found", 404);
  res.json({ success: true, data: { item } });
}));

router.delete("/:resource/:id", authenticate, requireRole(ADMIN), asyncHandler(async (req: Request, res: Response) => {
  const M = modelFor(req.params.resource);
  const item = await M.findByIdAndDelete(req.params.id);
  if (!item) throw new AppError("Not found", 404);
  res.json({ success: true, message: "Deleted" });
}));

export default router;