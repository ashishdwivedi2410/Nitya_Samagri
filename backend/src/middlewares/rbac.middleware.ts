// src/middlewares/rbac.middleware.ts
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export function requireRole(roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError("Authentication required", 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Access denied. Required role: ${roles.join(" or ")}`, 403));
    }
    next();
  };
}