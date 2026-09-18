// src/database/models/LoyaltyLog.ts
// Audit trail for User.loyaltyPoints changes (welcome bonus, order rewards, redemptions).
import { Schema, model, Document, Types } from "mongoose";

export interface ILoyaltyLog extends Document {
  userId: Types.ObjectId;
  points: number; // positive = earned, negative = redeemed
  reason: "welcome_bonus" | "order_reward" | "redemption" | "manual_adjustment" | "expiry";
  orderId?: Types.ObjectId;
  createdAt: Date;
}

const loyaltyLogSchema = new Schema<ILoyaltyLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    points: { type: Number, required: true },
    reason: {
      type: String,
      enum: ["welcome_bonus", "order_reward", "redemption", "manual_adjustment", "expiry"],
      required: true,
    },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const LoyaltyLog = model<ILoyaltyLog>("LoyaltyLog", loyaltyLogSchema);