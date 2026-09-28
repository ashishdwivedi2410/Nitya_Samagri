// src/modules/cms/cms.routes.ts — generic CRUD for all 6 CMS content types
import { Router, Request, Response } from "express";
import { Model } from "mongoose";
import { Banner, Festival, Blog, Section, Announcement, SeoPage } from "../../database/models/CmsContent";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../middlewares/async.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/rbac.middleware";

const router = Router();
const ADMIN = ["admin", "super_admin"];
const MODELS = { banners: Banner, festivals: Festival, blogs: Blog, sections: Section, announcements: Announcement, "seo-pages": SeoPage } as const;
type Key = keyof typeof MODELS;

function modelFor(key: string): Model<any> {
  const m = MODELS[key as Key];
  if (!m) throw new AppError(`Unknown CMS resource: ${key}`, 404);
  return m;
}

// ── Public storefront routes (festivals only) ───────────────────────────────
// Two extra path segments, so these don't collide with the generic
// "/:resource" (single segment) route below — Express matches whichever
// pattern fits the URL shape, and these are registered first anyway.

// GET /api/v1/cms/festivals-public — active/upcoming festivals only, for the
// storefront's /festival index page.
router.get("/festivals-public", asyncHandler(async (_req: Request, res: Response) => {
  const items = await Festival.find({ status: { $in: ["active", "upcoming"] } })
    .sort({ startDate: 1 })
    .lean();
  res.json({ success: true, data: { items } });
}));

// GET /api/v1/cms/festivals-public/:slug — single festival with its
// campaign products populated, for the storefront's /festival/[slug] page.
router.get("/festivals-public/:slug", asyncHandler(async (req: Request, res: Response) => {
  const item = await Festival.findOne({ slug: req.params.slug, status: { $in: ["active", "upcoming"] } })
    .populate("productIds")
    .lean();
  if (!item) throw new AppError("Festival not found", 404);
  res.json({ success: true, data: { item } });
}));

// GET returns everything — filtering by active/status is left to callers
// (admin UI always wants the full list; a public storefront consumer can
// filter client-side, since each resource's "is this live" field has a
// different name: Banner.status, Section/Announcement.active, Festival.status).
router.get("/:resource", asyncHandler(async (req: Request, res: Response) => {
  const M = modelFor(req.params.resource);
  const items = await M.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
  res.json({ success: true, data: { items } });
}));

router.post("/:resource", authenticate, requireRole(ADMIN), asyncHandler(async (req: Request, res: Response) => {
  const M = modelFor(req.params.resource);
  const body = { ...req.body };
  // Festivals need a URL-friendly slug for the storefront; auto-generate
  // from name if the admin didn't supply one (same pattern as products).
  if (req.params.resource === "festivals" && !body.slug && body.name) {
    body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }
  const item = await M.create(body);
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