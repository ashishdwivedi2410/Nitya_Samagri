// src/database/models/WishlistItem.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IWishlistItem extends Document {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  createdAt: Date;
}

const wishlistItemSchema = new Schema<IWishlistItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

wishlistItemSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const WishlistItem = model<IWishlistItem>("WishlistItem", wishlistItemSchema);