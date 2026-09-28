// src/database/models/Brand.ts
// Product.brandId already references "Brand"; this model was missing, so
// brand could be stored on a product but never resolved to a name.
import { Schema, model, Document } from "mongoose";

export interface IBrand extends Document {
  name: string;
  slug: string;
  logoUrl?: string;
  isActive: boolean;
}

const brandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    logoUrl: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Brand = model<IBrand>("Brand", brandSchema);