// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS MODULE  ·  product.routes.ts
// ─────────────────────────────────────────────────────────────────────────────
import { Router, Request, Response } from "express";
import { z }   from "zod";
import { Prisma }       from "@prisma/client";
import { prisma }       from "../../config/prisma";
import { redis, cacheDelPattern } from "../../config/redis";
import { AppError }     from "../../utils/AppError";
import { asyncHandler } from "../../middlewares/async.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole }  from "../../middlewares/rbac.middleware";
import { validate }     from "../../middlewares/validate.middleware";
import { paginate }     from "../../utils/paginate";

const router = Router();
const CACHE_TTL = 300; // 5 min

type PrismaTx = Prisma.TransactionClient;

// ── Schemas ───────────────────────────────────────────────────────────────────
const ProductCreateSchema = z.object({
  name:        z.string().min(2).max(200),
  slug:        z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
  shortDesc:   z.string().max(300).optional(),
  categoryId:  z.string().uuid(),
  brandId:     z.string().uuid().optional(),
  mrp:         z.number().positive(),
  price:       z.number().positive(),
  costPrice:   z.number().positive().optional(),
  gstPct:      z.number().min(0).max(28).default(5),
  hsnCode:     z.string().optional(),
  sku:         z.string().min(3).max(50),
  stock:       z.number().int().min(0).default(0),
  lowStockAt:  z.number().int().min(0).default(10),
  weight:      z.number().positive().optional(),   // grams
  tags:        z.array(z.string()).optional(),
  isFeatured:  z.boolean().default(false),
  status:      z.enum(["draft","active","archived"]).default("draft"),
  variants: z.array(z.object({
    label:    z.string(),
    sku:      z.string(),
    price:    z.number().positive(),
    mrp:      z.number().positive(),
    stock:    z.number().int().min(0),
    weight:   z.number().positive().optional(),
    imageUrl: z.string().url().optional(),
  })).optional(),
});

const ProductUpdateSchema = ProductCreateSchema.partial();

const StockUpdateSchema = z.object({
  quantity:  z.number().int(),
  operation: z.enum(["set","add","subtract"]),
  note:      z.string().optional(),
});

const ProductQuerySchema = z.object({
  page:       z.coerce.number().int().min(1).default(1),
  limit:      z.coerce.number().int().min(1).max(100).default(20),
  q:          z.string().optional(),
  categoryId: z.string().uuid().optional(),
  minPrice:   z.coerce.number().optional(),
  maxPrice:   z.coerce.number().optional(),
  inStock:    z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  status:     z.enum(["draft","active","archived"]).optional(),
  sortBy:     z.enum(["price","createdAt","name","stock","sold"]).default("createdAt"),
  sortOrder:  z.enum(["asc","desc"]).default("desc"),
});

// ── Public routes ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/products
 * List products with filtering, search, pagination
 */
router.get("/", validate(ProductQuerySchema, "query"), asyncHandler(async (req: Request, res: Response) => {
  // The `validate` middleware overwrites req.query with the parsed/coerced
  // result at runtime, but req.query's static type (ParsedQs) doesn't
  // structurally overlap with the parsed shape, so a direct `as` cast is
  // rejected. Route through `unknown` since this is a genuinely safe cast.
  const q = req.query as unknown as z.infer<typeof ProductQuerySchema>;
  const cacheKey = `products:list:${JSON.stringify(q)}`;

  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));

  const where: Record<string, unknown> = { status: q.status || "active" };
  if (q.q)          where.OR = [
    { name:        { contains: q.q, mode: "insensitive" } },
    { description: { contains: q.q, mode: "insensitive" } },
    { sku:         { contains: q.q, mode: "insensitive" } },
  ];
  if (q.categoryId) where.categoryId = q.categoryId;
  if (q.inStock)    where.stock = { gt: 0 };
  if (q.isFeatured) where.isFeatured = true;
  if (q.minPrice || q.maxPrice) {
    where.price = {};
    if (q.minPrice) (where.price as Record<string,unknown>).gte = q.minPrice;
    if (q.maxPrice) (where.price as Record<string,unknown>).lte = q.maxPrice;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: { select: { id: true, name: true } }, variants: true },
      orderBy: { [q.sortBy]: q.sortOrder },
      ...paginate(q.page, q.limit),
    }),
    prisma.product.count({ where }),
  ]);

  const result = {
    success: true,
    data:    { products, pagination: { page: q.page, limit: q.limit, total, pages: Math.ceil(total / q.limit) } },
  };

  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
  res.json(result);
}));

/**
 * GET /api/v1/products/:slug
 * Get single product by slug (public)
 */
router.get("/:slug", asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = `products:slug:${req.params.slug}`;
  const cached   = await redis.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));

  const product = await prisma.product.findFirst({
    where:   { slug: req.params.slug, status: "active" },
    include: {
      category:  { select: { id: true, name: true, slug: true } },
      variants:  true,
      reviews:   { where: { isApproved: true }, take: 10, orderBy: { createdAt: "desc" },
                   include: { user: { select: { name: true } } } },
      _count:    { select: { reviews: true } },
    },
  });

  if (!product) throw new AppError("Product not found", 404);

  // Related products (same category)
  const related = await prisma.product.findMany({
    where:   { categoryId: product.categoryId, status: "active", id: { not: product.id } },
    take:    6,
    select:  { id: true, name: true, slug: true, price: true, mrp: true, stock: true },
  });

  const result = { success: true, data: { product, related } };
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
  res.json(result);
}));

// ── Admin routes ──────────────────────────────────────────────────────────────

/**
 * POST /api/v1/products
 * Create product (admin only)
 */
router.post("/",
  authenticate, requireRole(["admin","super_admin"]),
  validate(ProductCreateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data = req.body;

    // Auto-generate slug if not provided
    if (!data.slug) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }

    // Check slug uniqueness
    const existing = await prisma.product.findUnique({ where: { slug: data.slug } });
    if (existing) throw new AppError("A product with this slug already exists", 409);

    const { variants, ...productData } = data;

    const product = await prisma.product.create({
      data: {
        ...productData,
        variants: variants ? { create: variants } : undefined,
      },
      include: { variants: true },
    });

    // Invalidate product list cache
    await cacheDelPattern("products:list:*");

    res.status(201).json({ success: true, data: { product } });
  })
);

/**
 * PATCH /api/v1/products/:id
 * Update product (admin only)
 */
router.patch("/:id",
  authenticate, requireRole(["admin","super_admin"]),
  validate(ProductUpdateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { variants, ...data } = req.body;

    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) throw new AppError("Product not found", 404);

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data,
      include: { variants: true },
    });

    // Bust cache
    await redis.del(`products:slug:${product.slug}`);
    await cacheDelPattern("products:list:*");

    res.json({ success: true, data: { product: updated } });
  })
);

/**
 * DELETE /api/v1/products/:id
 * Soft-delete (archive) product
 */
router.delete("/:id",
  authenticate, requireRole(["super_admin"]),
  asyncHandler(async (req: Request, res: Response) => {
    await prisma.product.update({
      where: { id: req.params.id },
      data:  { status: "archived" },
    });
    res.json({ success: true, message: "Product archived" });
  })
);

/**
 * PATCH /api/v1/products/:id/stock
 * Update stock (warehouse staff)
 */
router.patch("/:id/stock",
  authenticate, requireRole(["admin","super_admin","warehouse"]),
  validate(StockUpdateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { quantity, operation, note } = req.body as z.infer<typeof StockUpdateSchema>;

    if (operation === "set" && quantity < 0) {
      throw new AppError("Stock cannot be negative", 400);
    }

    const newStock = await prisma.$transaction(async (tx: PrismaTx) => {
      const exists = await tx.product.findUnique({ where: { id: req.params.id }, select: { id: true } });
      if (!exists) throw new AppError("Product not found", 404);

      let updated;
      if (operation === "set") {
        updated = await tx.product.update({ where: { id: req.params.id }, data: { stock: quantity } });
      } else if (operation === "add") {
        // Atomic DB-level increment — no read-then-write race.
        updated = await tx.product.update({ where: { id: req.params.id }, data: { stock: { increment: quantity } } });
      } else {
        // subtract — atomic, conditional decrement: the `stock: { gte }`
        // guard means two concurrent subtract requests racing for the same
        // units can't both succeed and drive stock negative, unlike the
        // previous read-current-value-then-write-new-value approach.
        const result = await tx.product.updateMany({
          where: { id: req.params.id, stock: { gte: quantity } },
          data:  { stock: { decrement: quantity } },
        });
        if (result.count === 0) throw new AppError("Stock cannot be negative", 400);
        updated = await tx.product.findUniqueOrThrow({ where: { id: req.params.id } });
      }

      // Log inventory movement (same transaction — never logged without
      // the stock change actually having happened, or vice versa)
      await tx.inventoryLog.create({
        data: {
          productId:  req.params.id,
          operation,
          quantity,
          stockAfter: updated.stock,
          note:       note || "",
          adminId:    req.user!.userId,
        },
      });

      return updated.stock;
    });

    res.json({ success: true, data: { stock: newStock } });
  })
);

export default router;
