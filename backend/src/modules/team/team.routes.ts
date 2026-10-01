// src/modules/team/team.routes.ts
//
// "Team & Roles" — lets super_admin add staff members (admin, order_manager,
// warehouse, support, pandit), assign each one a base role plus fine-grained
// permissions, and define reusable custom Role templates. Everything here is
// gated to super_admin only: only super_admin can grant access, which keeps
// privilege escalation impossible for anyone else.
import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { User } from "../../database/models/User";
import { Role } from "../../database/models/Role";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../middlewares/async.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { PERMISSIONS, DEFAULT_PERMISSIONS_BY_ROLE, isValidPermission } from "../../config/permissions";

const router = Router();
const SUPER_ADMIN = ["super_admin"];
const STAFF_ROLES = ["admin", "super_admin", "order_manager", "warehouse", "pandit", "support"] as const;

router.use(authenticate, requireRole(SUPER_ADMIN));

// ── Permission catalog (for building the checkbox UI) ──────────────────────
router.get("/permissions", asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: { permissions: PERMISSIONS, defaultsByRole: DEFAULT_PERMISSIONS_BY_ROLE } });
}));

// ── Roles (reusable permission templates) ───────────────────────────────────
const RoleBaseSchema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(200).optional(),
  permissions: z.array(z.string()).min(1),
});
const validPerms = (arr: string[]) => arr.every(isValidPermission);
const RoleSchema = RoleBaseSchema.refine((d) => validPerms(d.permissions), { message: "Unknown permission key", path: ["permissions"] });
const RoleUpdateSchema = RoleBaseSchema.partial().refine((d) => !d.permissions || validPerms(d.permissions), { message: "Unknown permission key", path: ["permissions"] });

router.get("/roles", asyncHandler(async (_req: Request, res: Response) => {
  const roles = await Role.find().sort({ isSystem: -1, name: 1 }).lean();
  res.json({ success: true, data: { roles } });
}));

router.post("/roles", validate(RoleSchema), asyncHandler(async (req: Request, res: Response) => {
  const existing = await Role.findOne({ name: req.body.name });
  if (existing) throw new AppError("A role with this name already exists", 409);
  const role = await Role.create({ ...req.body, createdBy: req.user!.userId });
  res.status(201).json({ success: true, data: { role } });
}));

router.patch("/roles/:id", validate(RoleUpdateSchema), asyncHandler(async (req: Request, res: Response) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw new AppError("Role not found", 404);
  if (role.isSystem) throw new AppError("Built-in roles can't be edited — create a custom role instead", 400);
  Object.assign(role, req.body);
  await role.save();
  res.json({ success: true, data: { role } });
}));

router.delete("/roles/:id", asyncHandler(async (req: Request, res: Response) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw new AppError("Role not found", 404);
  if (role.isSystem) throw new AppError("Built-in roles can't be deleted", 400);
  const inUse = await User.countDocuments({ roleTemplate: role._id });
  if (inUse > 0) throw new AppError(`${inUse} member(s) are using this role. Reassign them first.`, 409);
  await role.deleteOne();
  res.json({ success: true, data: { deleted: true } });
}));

// ── Team members ─────────────────────────────────────────────────────────────
const MemberSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email().refine((e) => e.toLowerCase().endsWith("@adminns.in"), { message: "Staff accounts must use an @adminns.in email" }),
  phone: z.string().regex(/^\+91[6-9]\d{9}$/, "Invalid Indian mobile number"),
  role: z.enum(STAFF_ROLES),
  roleTemplate: z.string().optional(), // Role _id used to prefill permissions
  permissions: z.array(z.string()).refine((arr) => arr.every(isValidPermission), { message: "Unknown permission key" }).default([]),
  password: z.string().min(8).max(72).optional(), // optional: auto-generated if omitted
});

const MemberUpdateSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  role: z.enum(STAFF_ROLES).optional(),
  roleTemplate: z.string().nullable().optional(),
  permissions: z.array(z.string()).refine((arr) => arr.every(isValidPermission), { message: "Unknown permission key" }).optional(),
  status: z.enum(["active", "blocked"]).optional(),
});

function generateTempPassword() {
  // e.g. "Ns-7f3a9c2e1b" — meets the 8-char login password requirement
  return `Ns-${crypto.randomBytes(5).toString("hex")}`;
}

router.get("/members", asyncHandler(async (_req: Request, res: Response) => {
  const members = await User.find({ role: { $in: STAFF_ROLES } })
    .select("name email phone role permissions roleTemplate status lastLoginAt createdAt invitedBy")
    .populate("roleTemplate", "name")
    .populate("invitedBy", "name")
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: { members } });
}));

router.post("/members", validate(MemberSchema), asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, role, roleTemplate, permissions, password } = req.body;

  const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
  if (existing) throw new AppError("A user with this email or phone already exists", 409);

  let effectivePermissions = permissions?.length ? permissions : DEFAULT_PERMISSIONS_BY_ROLE[role] || [];
  if (roleTemplate) {
    const template = await Role.findById(roleTemplate);
    if (!template) throw new AppError("Role template not found", 404);
    effectivePermissions = Array.from(new Set([...template.permissions, ...(permissions || [])]));
  }

  const tempPassword = password || generateTempPassword();
  const hashed = await bcrypt.hash(tempPassword, 12);

  const member = await User.create({
    name, email: email.toLowerCase(), phone, role,
    permissions: effectivePermissions,
    roleTemplate: roleTemplate || undefined,
    password: hashed, isVerified: true, status: "active",
    invitedBy: req.user!.userId,
  });

  res.status(201).json({
    success: true,
    data: {
      member: { id: member._id, name: member.name, email: member.email, role: member.role, permissions: member.permissions },
      // Only returned once, at creation — the super_admin must relay this to the new member themselves.
      temporaryPassword: password ? undefined : tempPassword,
    },
  });
}));

router.patch("/members/:id", validate(MemberUpdateSchema), asyncHandler(async (req: Request, res: Response) => {
  const member = await User.findById(req.params.id);
  if (!member || !STAFF_ROLES.includes(member.role as any)) throw new AppError("Team member not found", 404);
  if (member.role === "super_admin" && req.body.role && req.body.role !== "super_admin" && String(member._id) === req.user!.userId) {
    throw new AppError("You can't demote your own account", 400);
  }

  const { name, role, roleTemplate, permissions, status } = req.body;
  if (name !== undefined) member.name = name;
  if (role !== undefined) member.role = role;
  if (status !== undefined) member.status = status;
  if (roleTemplate !== undefined) member.roleTemplate = roleTemplate || undefined;
  if (permissions !== undefined) member.permissions = permissions;
  else if (roleTemplate) {
    const template = await Role.findById(roleTemplate);
    if (template) member.permissions = Array.from(new Set([...template.permissions, ...member.permissions]));
  }

  await member.save();
  res.json({ success: true, data: { member } });
}));

// Soft-remove: block the account rather than deleting, to preserve audit
// trails (who created what, inventory log "performedBy", etc.)
router.delete("/members/:id", asyncHandler(async (req: Request, res: Response) => {
  if (req.params.id === req.user!.userId) throw new AppError("You can't remove your own account", 400);
  const member = await User.findById(req.params.id);
  if (!member || !STAFF_ROLES.includes(member.role as any)) throw new AppError("Team member not found", 404);
  member.status = "blocked";
  await member.save();
  res.json({ success: true, data: { member } });
}));

export default router;