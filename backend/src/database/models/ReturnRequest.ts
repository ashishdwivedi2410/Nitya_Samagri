// src/database/models/ReturnRequest.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IReturnRequest extends Document {
  returnId: string; // e.g. RT-20260917-0001
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  orderItemId: Types.ObjectId;
  reason: string;
  status: "requested" | "approved" | "rejected" | "picked_up" | "refunded";
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const returnRequestSchema = new Schema<IReturnRequest>(
  {
    returnId: { type: String, required: true, unique: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderItemId: { type: Schema.Types.ObjectId, ref: "OrderItem", required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["requested", "approved", "rejected", "picked_up", "refunded"],
      default: "requested",
      index: true,
    },
    refundAmount: { type: Number },
  },
  { timestamps: true }
);

export const ReturnRequest = model<IReturnRequest>("ReturnRequest", returnRequestSchema);