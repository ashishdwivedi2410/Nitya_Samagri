// src/database/models/Role.ts
//
// A Role is a named, reusable set of permissions (e.g. "Festival Content
// Editor" -> [products.manage, store.manage]) that super_admin can define
// and then apply to one or more team members. Assigning a Role to a member
// copies its permissions onto User.permissions at that moment — later
// edits to the Role do NOT retroactively change existing members, so
// changing what "Content Editor" means never silently changes what
// someone's account can already do. roleId is kept only for display
// ("this member was set up using the Content Editor template").

import { Schema, model, Document, Types } from "mongoose";

export interface IRole extends Document {
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean; // built-in templates (admin/order_manager/warehouse/support/pandit) cannot be deleted
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    permissions: [{ type: String }],
    isSystem: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Role = model<IRole>("Role", roleSchema);