// src/database/models/CmsContent.ts — Banner, Festival, Blog, Section, Announcement, SeoPage
import { Schema, model, Document } from "mongoose";

export interface IBanner extends Document {
  title: string; desktopEmoji?: string; mobileEmoji?: string; imageUrl?: string; cta?: string; url?: string;
  status: "active" | "draft" | "expired"; startDate?: Date; endDate?: Date; clicks: number; sortOrder: number;
}
const bannerSchema = new Schema<IBanner>({
  title: { type: String, required: true }, desktopEmoji: String, mobileEmoji: String, imageUrl: String,
  cta: String, url: String, status: { type: String, enum: ["active", "draft", "expired"], default: "draft" },
  startDate: Date, endDate: Date, clicks: { type: Number, default: 0 }, sortOrder: { type: Number, default: 0 },
}, { timestamps: true });
export const Banner = model<IBanner>("Banner", bannerSchema);

export interface IFestival extends Document {
  name: string; icon?: string; startDate: Date; endDate: Date; status: "upcoming" | "draft" | "active" | "completed";
  color?: string; productIds: string[]; revenue: number;
}
const festivalSchema = new Schema<IFestival>({
  name: { type: String, required: true }, icon: String, startDate: { type: Date, required: true }, endDate: { type: Date, required: true },
  status: { type: String, enum: ["upcoming", "draft", "active", "completed"], default: "draft" },
  color: String, productIds: [{ type: Schema.Types.ObjectId, ref: "Product" }], revenue: { type: Number, default: 0 },
}, { timestamps: true });
export const Festival = model<IFestival>("Festival", festivalSchema);

export interface IBlog extends Document {
  title: string; slug: string; category?: string; excerpt?: string; content: string; coverImage?: string;
  author?: string; tags: string[]; views: number; status: "draft" | "published"; publishedAt?: Date;
}
const blogSchema = new Schema<IBlog>({
  title: { type: String, required: true }, slug: { type: String, required: true, unique: true, index: true },
  category: String, excerpt: String, content: { type: String, default: "" }, coverImage: String, author: String,
  tags: [{ type: String }], views: { type: Number, default: 0 },
  status: { type: String, enum: ["draft", "published"], default: "draft", index: true }, publishedAt: Date,
}, { timestamps: true });
export const Blog = model<IBlog>("Blog", blogSchema);

export interface ISection extends Document {
  label: string; type: "banner" | "festival" | "products" | "reviews" | "blog" | "custom_html";
  active: boolean; sortOrder: number; config: Record<string, unknown>;
}
const sectionSchema = new Schema<ISection>({
  label: { type: String, required: true }, type: { type: String, enum: ["banner", "festival", "products", "reviews", "blog", "custom_html"], required: true },
  active: { type: Boolean, default: true }, sortOrder: { type: Number, default: 0 }, config: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });
export const Section = model<ISection>("Section", sectionSchema);

export interface IAnnouncement extends Document {
  text: string; active: boolean; startDate?: Date; endDate?: Date; bg?: string; color?: string;
}
const announcementSchema = new Schema<IAnnouncement>({
  text: { type: String, required: true }, active: { type: Boolean, default: true },
  startDate: Date, endDate: Date, bg: String, color: String,
}, { timestamps: true });
export const Announcement = model<IAnnouncement>("Announcement", announcementSchema);

export interface ISeoPage extends Document {
  page: string; title: string; desc?: string; score?: number;
}
const seoPageSchema = new Schema<ISeoPage>({
  page: { type: String, required: true, unique: true, index: true }, title: { type: String, required: true },
  desc: String, score: { type: Number, min: 0, max: 100 },
}, { timestamps: true });
export const SeoPage = model<ISeoPage>("SeoPage", seoPageSchema);