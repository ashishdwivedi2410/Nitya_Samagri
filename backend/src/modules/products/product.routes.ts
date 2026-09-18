// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS MODULE  ·  product.routes.ts
// Converted from Prisma/PostgreSQL to Mongoose/MongoDB.
// ─────────────────────────────────────────────────────────────────────────────
import { Router, Request, Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { Product } from "../../database/models/Product";
import { ProductVariant } from "../../database/models/ProductVariant";
import { Review } from "../../database/models/Review";
import { InventoryLog } from "../../database/models/InventoryLog";
import { redis, cacheDelPattern } from "../../config/redis";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../middlewares/async.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { paginate } from "../../utils/paginate";

const router = Router();
const CACHE_TTL = 300; // 5 min

// z.string().uuid() everywhere in the original schemas assumed Postgres
// UUID primary keys. Mongo uses ObjectId strings instead, so every ID
// field below validates against that shape instead.
const objectId = () => z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID");

// ── Schemas ───────────────────────────────────────────────────────────────────
const ProductCreateSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
  shortDesc: z.string().max(300).optional(),
  categoryId: objectId(),
  brandId: objectId().optional(),
  mrp: z.number().positive(),
  price: z.number().positive(),
  costPrice: z.number().positive().optional(),
  gstPct: z.number().min(0).max(28).default(5),
  hsnCode: z.string().optional(),
  sku: z.string().min(3).max(50),
  stock: z.number().int().min(0).default(0),
  lowStockAt: z.number().int().min(0).default(10),
  weight: z.number().positive().optional(),
  tags: z.array(z.string()).optional(),
  isFeatured: z.boolean().default(false),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  variants: z
    .array(
      z.object({
        label: z.string(),
        sku: z.string(),
        price: z.number().positive(),
        mrp: z.number().positive(),
        stock: z.number().int().min(0),
        weight: z.number().positive().optional(),
        imageUrl: z.string().url().optional(),
      })
    )
    .optional(),
});

const ProductUpdateSchema = ProductCreateSchema.partial();

const StockUpdateSchema = z.object({
  quantity: z.number().int(),
  operation: z.enum(["set", "add", "subtract"]),
  note: z.string().optional(),
});

const ProductQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().optional(),
  categoryId: objectId().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  inStock: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  sortBy: z.enum(["price", "createdAt", "name", "stock", "sold"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ── Public routes ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/products
 * List products with filtering, search, pagination
 */
router.get(
  "/",
  validate(ProductQuerySchema, "query"),
  asyncHandler(async (req: Request, res: Response) => {
    const q = req.query as unknown as z.infer<typeof ProductQuerySchema>;
    const cacheKey = `products:list:${JSON.stringify(q)}`;

    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const filter: Record<string, unknown> = { status: q.status || "active" };
    if (q.q) {
      // Uses the text index declared on Product's schema (name/description/tags)
      filter.$text = { $search: q.q };
    }
    if (q.categoryId) filter.categoryId = q.categoryId;
    if (q.inStock) filter.stock = { $gt: 0 };
    if (q.isFeatured) filter.isFeatured = true;
    if (q.minPrice || q.maxPrice) {
      filter.price = {};
      if (q.minPrice) (filter.price as Record<string, unknown>).$gte = q.minPrice;
      if (q.maxPrice) (filter.price as Record<string, unknown>).$lte = q.maxPrice;
    }

    const { skip, take } = paginate(q.page, q.limit);
    const sort: Record<string, 1 | -1> = { [q.sortBy]: q.sortOrder === "asc" ? 1 : -1 };

    const [products, total] = await Promise.all([
      Product.find(filter).populate("categoryId", "name").sort(sort).skip(skip).limit(take).lean(),
      Product.countDocuments(filter),
    ]);

    // Attach variants (separate collection — no $lookup needed for a
    // simple per-product fetch at this scale, but batched to avoid N+1)
    const productIds = products.map((p) => p._id);
    const variants = await ProductVariant.find({ productId: { $in: productIds } }).lean();
    const variantsByProduct = new Map<string, typeof variants>();
    for (const v of variants) {
      const key = String(v.productId);
      if (!variantsByProduct.has(key)) variantsByProduct.set(key, []);
      variantsByProduct.get(key)!.push(v);
    }
    const productsWithVariants = products.map((p) => ({
      ...p,
      variants: variantsByProduct.get(String(p._id)) || [],
    }));

    const result = {
      success: true,
      data: { products: productsWithVariants, pagination: { page: q.page, limit: q.limit, total, pages: Math.ceil(total / q.limit) } },
    };

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
    res.json(result);
  })
);

/**
 * GET /api/v1/products/:slug
 * Get single product by slug (public)
 */
router.get(
  "/:slug",
  asyncHandler(async (req: Request, res: Response) => {
    const cacheKey = `products:slug:${req.params.slug}`;
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const product = await Product.findOne({ slug: req.params.slug, status: "active" })
      .populate("categoryId", "name slug")
      .lean();

    if (!product) throw new AppError("Product not found", 404);

    const [variants, reviews, reviewCount, related] = await Promise.all([
      ProductVariant.find({ productId: product._id }).lean(),
      Review.find({ productId: product._id, isApproved: true })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("userId", "name")
        .lean(),
      Review.countDocuments({ productId: product._id, isApproved: true }),
      Product.find({ categoryId: product.categoryId, status: "active", _id: { $ne: product._id } })
        .select("name slug price mrp stock")
        .limit(6)
        .lean(),
    ]);

    const result = {
      success: true,
      data: {
        product: { ...product, variants, reviews, reviewCount },
        related,
      },
    };
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
    res.json(result);
  })
);

// ── Admin routes ──────────────────────────────────────────────────────────────

/**
 * POST /api/v1/products
 * Create product (admin only)
 */
router.post(
  "/",
  authenticate,
  requireRole(["admin", "super_admin"]),
  validate(ProductCreateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data = req.body;

    if (!data.slug) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }

    const existing = await Product.findOne({ slug: data.slug });
    if (existing) throw new AppError("A product with this slug already exists", 409);

    const { variants, ...productData } = data;

    const product = await Product.create(productData);

    let createdVariants: unknown[] = [];
    if (variants?.length) {
      createdVariants = await ProductVariant.insertMany(
        variants.map((v: Record<string, unknown>) => ({ ...v, productId: product._id }))
      );
    }

    await cacheDelPattern("products:list:*");

    res.status(201).json({ success: true, data: { product: { ...product.toObject(), variants: createdVariants } } });
  })
);

/**
 * PATCH /api/v1/products/:id
 * Update product (admin only)
 */
router.patch(
  "/:id",
  authenticate,
  requireRole(["admin", "super_admin"]),
  validate(ProductUpdateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { variants, ...data } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) throw new AppError("Product not found", 404);

    Object.assign(product, data);
    await product.save();

    const productVariants = await ProductVariant.find({ productId: product._id }).lean();

    await redis.del(`products:slug:${product.slug}`);
    await cacheDelPattern("products:list:*");

    res.json({ success: true, data: { product: { ...product.toObject(), variants: productVariants } } });
  })
);

/**
 * DELETE /api/v1/products/:id
 * Soft-delete (archive) product
 */
router.delete(
  "/:id",
  authenticate,
  requireRole(["super_admin"]),
  asyncHandler(async (req: Request, res: Response) => {
    const product = await Product.findByIdAndUpdate(req.params.id, { status: "archived" });
    if (!product) throw new AppError("Product not found", 404);
    res.json({ success: true, message: "Product archived" });
  })
);

/**
 * PATCH /api/v1/products/:id/stock
 * Update stock (warehouse staff)
 *
 * Uses a Mongo transaction (requires a replica-set-backed MongoDB — Atlas
 * or a local replica set, not a bare standalone mongod) to keep the stock
 * change and its InventoryLog entry atomic, matching the guarantee the
 * original Prisma $transaction gave.
 */
router.patch(
  "/:id/stock",
  authenticate,
  requireRole(["admin", "super_admin", "warehouse"]),
  validate(StockUpdateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { quantity, operation, note } = req.body as z.infer<typeof StockUpdateSchema>;

    if (operation === "set" && quantity < 0) {
      throw new AppError("Stock cannot be negative", 400);
    }

    const session = await mongoose.startSession();
    let newStock = 0;

    try {
      await session.withTransaction(async () => {
        const existing = await Product.findById(req.params.id).session(session);
        if (!existing) throw new AppError("Product not found", 404);

        let change = 0;
        if (operation === "set") {
          change = quantity - existing.stock;
          existing.stock = quantity;
          await existing.save({ session });
        } else if (operation === "add") {
          change = quantity;
          const updated = await Product.findByIdAndUpdate(
            req.params.id,
            { $inc: { stock: quantity } },
            { new: true, session }
          );
          existing.stock = updated!.stock;
        } else {
          // subtract — atomic, conditional decrement: the `stock: { $gte }`
          // guard means two concurrent subtract requests racing for the
          // same units can't both succeed and drive stock negative.
          const result = await Product.updateOne(
            { _id: req.params.id, stock: { $gte: quantity } },
            { $inc: { stock: -quantity } },
            { session }
          );
          if (result.modifiedCount === 0) throw new AppError("Stock cannot be negative", 400);
          change = -quantity;
          const updated = await Product.findById(req.params.id).session(session);
          existing.stock = updated!.stock;
        }

        await InventoryLog.create(
          [
            {
              productId: req.params.id,
              change,
              reason: "manual_adjustment",
              note: note || "",
              performedBy: req.user!.userId,
            },
          ],
          { session }
        );

        newStock = existing.stock;
      });
    } finally {
      await session.endSession();
    }

    res.json({ success: true, data: { stock: newStock } });
  })
);

export default router;