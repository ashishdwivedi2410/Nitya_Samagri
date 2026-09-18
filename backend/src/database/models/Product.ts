// src/database/models/Product.ts
// Fields match ProductCreateSchema in modules/products/product.routes.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IProduct extends Document {
  name: string;
  slug: string;
  description?: string;
  shortDesc?: string;
  categoryId: Types.ObjectId;
  brandId?: Types.ObjectId;
  mrp: number;
  price: number;
  costPrice?: number;
  gstPct: number;
  hsnCode?: string;
  sku: string;
  stock: number;
  lowStockAt: number;
  weight?: number;
  tags: string[];
  isFeatured: boolean;
  status: "draft" | "active" | "archived";
  sold: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 200 },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    shortDesc: { type: String, maxlength: 300 },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    brandId: { type: Schema.Types.ObjectId, ref: "Brand" },
    mrp: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0, index: true },
    costPrice: { type: Number, min: 0 },
    gstPct: { type: Number, default: 5, min: 0, max: 28 },
    hsnCode: { type: String },
    sku: { type: String, required: true, unique: true, minlength: 3, maxlength: 50 },
    stock: { type: Number, default: 0, min: 0 },
    lowStockAt: { type: Number, default: 10, min: 0 },
    weight: { type: Number, min: 0 },
    tags: [{ type: String }],
    isFeatured: { type: Boolean, default: false, index: true },
    status: { type: String, enum: ["draft", "active", "archived"], default: "draft", index: true },
    sold: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text", tags: "text" });

export const Product = model<IProduct>("Product", productSchema);