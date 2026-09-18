// src/database/models/PanditProfile.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IPanditProfile extends Document {
  userId: Types.ObjectId; // links to User with role "pandit"
  bio?: string;
  languages: string[];
  experienceYears?: number;
  city: string;
  photoUrl?: string;
  isVerified: boolean;
  isActive: boolean;
  rating: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const panditProfileSchema = new Schema<IPanditProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    bio: { type: String },
    languages: [{ type: String }],
    experienceYears: { type: Number, min: 0 },
    city: { type: String, required: true, index: true },
    photoUrl: { type: String },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const PanditProfile = model<IPanditProfile>("PanditProfile", panditProfileSchema);