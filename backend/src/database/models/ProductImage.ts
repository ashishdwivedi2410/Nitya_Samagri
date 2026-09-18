// src/database/models/ProductImage.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IProductImage extends Document {
  productId: Types.ObjectId;
  url: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: Date;
}

const productImageSchema = new Schema<IProductImage>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    url: { type: String, required: true },
    altText: { type: String },
    sortOrder: { type: Number, default: 0 },
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ProductImage = model<IProductImage>("ProductImage", productImageSchema);