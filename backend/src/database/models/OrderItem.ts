// src/database/models/OrderItem.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IOrderItem extends Document {
  orderId: Types.ObjectId;
  productId: Types.ObjectId;
  variantId?: Types.ObjectId;
  productName: string; // snapshot, in case the product is later renamed/deleted
  sku: string;
  qty: number;
  price: number; // server-resolved unit price at time of purchase
  total: number; // price * qty, stored so historical totals never drift if `price` logic changes later
  gstPct: number;
  createdAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: Schema.Types.ObjectId, ref: "ProductVariant" },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    gstPct: { type: Number, default: 5 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const OrderItem = model<IOrderItem>("OrderItem", orderItemSchema);