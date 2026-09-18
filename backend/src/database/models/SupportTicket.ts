// src/database/models/SupportTicket.ts
import { Schema, model, Document, Types } from "mongoose";

export interface ISupportTicket extends Document {
  ticketId: string; // e.g. ST-20260917-0001
  userId: Types.ObjectId;
  orderId?: Types.ObjectId;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  assignedTo?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    ticketId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open", index: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const SupportTicket = model<ISupportTicket>("SupportTicket", supportTicketSchema);