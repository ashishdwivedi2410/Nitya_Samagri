// src/database/models/ProductVariant.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IProductVariant extends Document {
  productId: Types.ObjectId;
  label: string;
  sku: string;
  price: number;
  mrp: number;
  stock: number;
  weight?: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productVariantSchema = new Schema<IProductVariant>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    label: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    weight: { type: Number, min: 0 },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ProductVariant = model<IProductVariant>("ProductVariant", productVariantSchema);