// src/database/models/PanditAvailability.ts
// Weekly recurring availability window, e.g. Mon 09:00-13:00.
import { Schema, model, Document, Types } from "mongoose";

export interface IPanditAvailability extends Document {
  panditId: Types.ObjectId;
  dayOfWeek: number; // 0 = Sunday .. 6 = Saturday
  startTime: string; // "09:00"
  endTime: string;   // "13:00"
  createdAt: Date;
}

const panditAvailabilitySchema = new Schema<IPanditAvailability>(
  {
    panditId: { type: Schema.Types.ObjectId, ref: "PanditProfile", required: true, index: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const PanditAvailability = model<IPanditAvailability>("PanditAvailability", panditAvailabilitySchema);