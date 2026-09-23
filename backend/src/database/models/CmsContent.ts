// src/database/models/CmsContent.ts — Banner, Festival, Blog, Section, Announcement, SeoPage (one file, related CMS types)
import { Schema, model, Document } from "mongoose";

export interface IBanner extends Document {
  title: string; imageUrl: string; linkUrl?: string; sortOrder: number; isActive: boolean; startDate?: Date; endDate?: Date;
}
const bannerSchema = new Schema<IBanner>({
  title: { type: String, required: true }, imageUrl: { type: String, required: true },
  linkUrl: String, sortOrder: { type: Number, default: 0 }, isActive: { type: Boolean, default: true },
  startDate: Date, endDate: Date,
}, { timestamps: true });
export const Banner = model<IBanner>("Banner", bannerSchema);

export interface IFestival extends Document {
  name: string; date: Date; description?: string; imageUrl?: string; isActive: boolean;
}
const festivalSchema = new Schema<IFestival>({
  name: { type: String, required: true }, date: { type: Date, required: true }, description: String, imageUrl: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
export const Festival = model<IFestival>("Festival", festivalSchema);

export interface IBlog extends Document {
  title: string; slug: string; excerpt?: string; content: string; coverImage?: string; author?: string; status: "draft" | "published"; publishedAt?: Date;
}
const blogSchema = new Schema<IBlog>({
  title: { type: String, required: true }, slug: { type: String, required: true, unique: true, index: true },
  excerpt: String, content: { type: String, required: true }, coverImage: String, author: String,
  status: { type: String, enum: ["draft", "published"], default: "draft", index: true }, publishedAt: Date,
}, { timestamps: true });
export const Blog = model<IBlog>("Blog", blogSchema);

export interface ISection extends Document {
  key: string; title: string; type: "product_carousel" | "category_grid" | "custom_html"; config: Record<string, unknown>; sortOrder: number; isActive: boolean;
}
const sectionSchema = new Schema<ISection>({
  key: { type: String, required: true, unique: true }, title: { type: String, required: true },
  type: { type: String, enum: ["product_carousel", "category_grid", "custom_html"], required: true },
  config: { type: Schema.Types.Mixed, default: {} }, sortOrder: { type: Number, default: 0 }, isActive: { type: Boolean, default: true },
}, { timestamps: true });
export const Section = model<ISection>("Section", sectionSchema);

export interface IAnnouncement extends Document {
  message: string; type: "info" | "warning" | "promo"; isActive: boolean; startDate?: Date; endDate?: Date;
}
const announcementSchema = new Schema<IAnnouncement>({
  message: { type: String, required: true }, type: { type: String, enum: ["info", "warning", "promo"], default: "info" },
  isActive: { type: Boolean, default: true }, startDate: Date, endDate: Date,
}, { timestamps: true });
export const Announcement = model<IAnnouncement>("Announcement", announcementSchema);

export interface ISeoPage extends Document {
  path: string; title: string; metaDescription?: string; ogImage?: string;
}
const seoPageSchema = new Schema<ISeoPage>({
  path: { type: String, required: true, unique: true, index: true }, title: { type: String, required: true },
  metaDescription: String, ogImage: String,
}, { timestamps: true });
export const SeoPage = model<ISeoPage>("SeoPage", seoPageSchema);