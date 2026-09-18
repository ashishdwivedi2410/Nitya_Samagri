// src/database/models/InventoryLog.ts
// Audit trail for stock changes (matches the "note" param on the
// StockUpdateSchema in product.routes.ts).
import { Schema, model, Document, Types } from "mongoose";

export interface IInventoryLog extends Document {
  productId: Types.ObjectId;
  variantId?: Types.ObjectId;
  change: number; // positive or negative
  reason: "order" | "manual_adjustment" | "return" | "restock";
  note?: string;
  performedBy?: Types.ObjectId;
  createdAt: Date;
}

const inventoryLogSchema = new Schema<IInventoryLog>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    variantId: { type: Schema.Types.ObjectId, ref: "ProductVariant" },
    change: { type: Number, required: true },
    reason: { type: String, enum: ["order", "manual_adjustment", "return", "restock"], required: true },
    note: { type: String },
    performedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const InventoryLog = model<IInventoryLog>("InventoryLog", inventoryLogSchema);