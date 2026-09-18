// src/database/models/Review.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IReview extends Document {
  userId: Types.ObjectId;
  productId?: Types.ObjectId;
  panditId?: Types.ObjectId;
  orderId?: Types.ObjectId;
  rating: number; // 1-5
  title?: string;
  comment?: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", index: true },
    panditId: { type: Schema.Types.ObjectId, ref: "PanditProfile", index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String },
    comment: { type: String },
    isVerifiedPurchase: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const Review = model<IReview>("Review", reviewSchema);