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

const router = Router();

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

export default router;