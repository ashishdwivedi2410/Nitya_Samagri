// src/database/models/Category.ts
import { Schema, model, Document, Types } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: Types.ObjectId;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    imageUrl: { type: String },
    parentId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Category = model<ICategory>("Category", categorySchema);