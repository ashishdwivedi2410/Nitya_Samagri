// src/database/models/User.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IUser extends Document {
  name: string;
  phone: string;
  email?: string;
  password?: string;
  role: "customer" | "admin" | "super_admin" | "order_manager" | "warehouse" | "pandit" | "support";
  status: "active" | "blocked";
  isVerified: boolean;
  loyaltyPoints: number;
  loyaltyTier: "bronze" | "silver" | "gold" | "platinum";
  googleId?: string;
  firebaseUid?: string;
  fcmTokens: string[];
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, index: true },
    email: { type: String, lowercase: true, trim: true, index: true, sparse: true, unique: true },
    password: { type: String, select: false },
    role: { type: String, enum: ["customer", "admin", "super_admin", "order_manager", "warehouse", "pandit", "support"], default: "customer" },
    status: { type: String, enum: ["active", "blocked"], default: "active", index: true },
    isVerified: { type: Boolean, default: false },
    loyaltyPoints: { type: Number, default: 0 },
    loyaltyTier: { type: String, enum: ["bronze", "silver", "gold", "platinum"], default: "bronze" },
    googleId: { type: String, index: true, sparse: true },
    firebaseUid: { type: String, index: true, sparse: true },
    fcmTokens: [{ type: String }],
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
export type UserId = Types.ObjectId;