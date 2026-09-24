// src/database/models/Coupon.ts
// Fields match usage in orders/order.routes.ts's applyCoupon().
import { Schema, model, Document } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  desc?: string;
  type: "percent" | "flat";
  value: number;
  maxDiscount?: number;
  minOrderValue: number;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, index: true },
    desc: { type: String },
    type: { type: String, enum: ["percent", "flat"], required: true },
    value: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, min: 0 },
    minOrderValue: { type: Number, default: 0 },
    usageLimit: { type: Number },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

export const Coupon = model<ICoupon>("Coupon", couponSchema);