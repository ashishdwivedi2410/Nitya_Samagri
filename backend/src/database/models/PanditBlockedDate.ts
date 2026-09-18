// src/database/models/PanditBlockedDate.ts
// One-off exceptions to PanditAvailability — vacations, festivals booked out, etc.
import { Schema, model, Document, Types } from "mongoose";

export interface IPanditBlockedDate extends Document {
  panditId: Types.ObjectId;
  date: Date;
  reason?: string;
  createdAt: Date;
}

const panditBlockedDateSchema = new Schema<IPanditBlockedDate>(
  {
    panditId: { type: Schema.Types.ObjectId, ref: "PanditProfile", required: true, index: true },
    date: { type: Date, required: true, index: true },
    reason: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

panditBlockedDateSchema.index({ panditId: 1, date: 1 }, { unique: true });

export const PanditBlockedDate = model<IPanditBlockedDate>("PanditBlockedDate", panditBlockedDateSchema);