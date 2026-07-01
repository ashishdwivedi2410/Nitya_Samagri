// src/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

export function errorHandler(
  err: AppError & { code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log unexpected errors
  if (!err.isOperational) logger.error("Unexpected error:", err);

  // Prisma unique constraint
  if (err.code === "P2002") {
    return res.status(409).json({ success: false, message: "A record with this value already exists." });
  }
  // Prisma not found
  if (err.code === "P2025") {
    return res.status(404).json({ success: false, message: "Record not found." });
  }

  const statusCode = err.statusCode || 500;
  const message    = err.isOperational ? err.message : "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.errors && { errors: err.errors }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}