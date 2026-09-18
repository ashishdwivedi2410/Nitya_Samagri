// src/cache/cache.keys.ts
// Central place for Redis key naming so nothing typos a cache key and
// silently misses. Mirrors the key patterns already used inline in
// product.routes.ts ("products:list:*", "products:slug:<slug>").

export const cacheKeys = {
  productsList: (queryHash: string) => `products:list:${queryHash}`,
  productsListPattern: () => "products:list:*",
  productBySlug: (slug: string) => `products:slug:${slug}`,
  productById: (id: string) => `products:id:${id}`,
  categoryTree: () => "categories:tree",
  userById: (id: string) => `users:id:${id}`,
  couponByCode: (code: string) => `coupons:code:${code}`,
  orderStats: () => "orders:stats",
} as const;