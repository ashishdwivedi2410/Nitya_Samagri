// src/database/models/PanditService.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IPanditService extends Document {
  panditId: Types.ObjectId;
  name: string;
  description?: string;
  durationMins: number;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const panditServiceSchema = new Schema<IPanditService>(
  {
    panditId: { type: Schema.Types.ObjectId, ref: "PanditProfile", required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    durationMins: { type: Number, required: true, min: 15 },
    price: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const PanditService = model<IPanditService>("PanditService", panditServiceSchema);