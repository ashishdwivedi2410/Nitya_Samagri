// src/database/models/PanditBooking.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IPanditBooking extends Document {
  bookingId: string; // human-readable, e.g. PB-20260917-0001
  userId: Types.ObjectId;
  panditId: Types.ObjectId;
  serviceId: Types.ObjectId;
  scheduledDate: Date;
  scheduledTime: string;
  addressId?: Types.ObjectId;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  price: number;
  paymentStatus: "pending" | "paid" | "refunded";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const panditBookingSchema = new Schema<IPanditBooking>(
  {
    bookingId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    panditId: { type: Schema.Types.ObjectId, ref: "PanditProfile", required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: "PanditService", required: true },
    scheduledDate: { type: Date, required: true },
    scheduledTime: { type: String, required: true },
    addressId: { type: Schema.Types.ObjectId, ref: "Address" },
    status: { type: String, enum: ["pending", "confirmed", "completed", "cancelled"], default: "pending", index: true },
    price: { type: Number, required: true },
    paymentStatus: { type: String, enum: ["pending", "paid", "refunded"], default: "pending" },
    notes: { type: String },
  },
  { timestamps: true }
);

export const PanditBooking = model<IPanditBooking>("PanditBooking", panditBookingSchema);