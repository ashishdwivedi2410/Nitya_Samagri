// src/database/models/OrderTimeline.ts
//
// NEW — referenced by payment.routes.ts and integrations.routes.ts
// (prisma.orderTimeline.create(...)) but was missing from the original
// 22 model files. Added so those routes have something to point at.
import { Schema, model, Document, Types } from "mongoose";

export interface IOrderTimeline extends Document {
  orderId: Types.ObjectId;
  status: string;
  note?: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const orderTimelineSchema = new Schema<IOrderTimeline>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    status: { type: String, required: true },
    note: { type: String },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const OrderTimeline = model<IOrderTimeline>("OrderTimeline", orderTimelineSchema);