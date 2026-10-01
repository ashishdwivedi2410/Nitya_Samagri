// src/modules/categories/category.routes.ts
//
// Public read routes for categories. Admin CRUD for categories already
// happens through the products admin UI's category picker / seed data;
// this module only adds what the storefront needs: a list to build the
// "Browse by Category" section and /shop's filter dropdown, and a
// single-by-slug lookup for /category/[slug].
import { Router, Request, Response } from "express";
import { Category } from "../../database/models/Category";
import { Product } from "../../database/models/Product";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../middlewares/async.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/rbac.middleware";

const router = Router();
const ADMIN = ["admin", "super_admin"];

// GET /api/v1/categories — active top-level + nested categories, with a
// live product count per category (active products only). Product counts
// are computed with one aggregation rather than N+1 queries per category.
router.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    const [categories, counts] = await Promise.all([
      Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(),
      Product.aggregate([
        { $match: { status: "active" } },
        { $group: { _id: "$categoryId", count: { $sum: 1 } } },
      ]),
    ]);

    const countByCategory = new Map(counts.map((c) => [String(c._id), c.count]));
    const items = categories.map((c) => ({
      ...c,
      productCount: countByCategory.get(String(c._id)) || 0,
    }));

    res.json({ success: true, data: { items } });
  })
);

// GET /api/v1/categories/:slug — single active category by slug, for the
// /category/[slug] page header (name, description, banner image).
router.get(
  "/:slug",
  asyncHandler(async (req: Request, res: Response) => {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true }).lean();
    if (!category) throw new AppError("Category not found", 404);
    res.json({ success: true, data: { category } });
  })
);

// POST /api/v1/categories — admin creates a category (slug auto-generated),
// used by the admin Products form's inline "+ New Category" picker.
router.post(
  "/",
  authenticate,
  requireRole(ADMIN),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description, imageUrl, parentId } = req.body as {
      name?: string; description?: string; imageUrl?: string; parentId?: string;
    };
    if (!name || name.trim().length < 2) throw new AppError("Category name is required", 400);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const existing = await Category.findOne({ slug });
    if (existing) throw new AppError("A category with this name already exists", 409);
    const category = await Category.create({ name: name.trim(), slug, description, imageUrl, parentId: parentId || null });
    res.status(201).json({ success: true, data: { category } });
  })
);

// PATCH /api/v1/categories/:id — admin edit (name changes keep the slug).
router.patch(
  "/:id",
  authenticate,
  requireRole(ADMIN),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description, imageUrl, isActive, sortOrder } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { ...(name && { name }), ...(description !== undefined && { description }), ...(imageUrl !== undefined && { imageUrl }), ...(isActive !== undefined && { isActive }), ...(sortOrder !== undefined && { sortOrder }) },
      { new: true }
    );
    if (!category) throw new AppError("Category not found", 404);
    res.json({ success: true, data: { category } });
  })
);

export default router;