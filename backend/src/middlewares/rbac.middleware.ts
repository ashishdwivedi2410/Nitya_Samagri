// src/middlewares/rbac.middleware.ts
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { User } from "../database/models/User";

export function requireRole(roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError("Authentication required", 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Access denied. Required role: ${roles.join(" or ")}`, 403));
    }
    next();
  };
}

/**
 * Fine-grained permission check for the Team & Roles system. super_admin
 * always passes, regardless of their stored permissions array. Everyone
 * else needs `permission` present on their User.permissions.
 *
 * The JWT only carries { userId, role } (see auth.middleware.ts), so this
 * does one lightweight DB lookup per request rather than trusting a stale
 * permissions list baked into the token — a permission revoked by
 * super_admin takes effect on the member's very next request.
 */
export function requirePermission(permission: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError("Authentication required", 401));
    if (req.user.role === "super_admin") return next();
    const user = await User.findById(req.user.userId).select("permissions status").lean();
    if (!user || user.status !== "active") return next(new AppError("Access denied", 403));
    if (!user.permissions?.includes(permission)) {
      return next(new AppError(`Access denied. Missing permission: ${permission}`, 403));
    }
    next();
  };
}