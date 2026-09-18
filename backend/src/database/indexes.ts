// src/database/indexes.ts
//
// Most indexes are already declared inline on each schema (see each model
// file). This file is for the few compound/cross-cutting indexes that are
// easier to reason about in one place, plus a callable ensureIndexes() you
// can run once after deploy (mongoose builds indexes lazily on first use
// otherwise, which is fine for dev but worth doing explicitly in prod).

import { Product } from "./models/Product";
import { Order } from "./models/Order";
import { User } from "./models/User";

export async function ensureIndexes(): Promise<void> {
  await Promise.all([
    Product.syncIndexes(),
    Order.syncIndexes(),
    User.syncIndexes(),
  ]);
}