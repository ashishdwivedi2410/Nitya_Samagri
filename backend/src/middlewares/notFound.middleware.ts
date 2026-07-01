// src/middlewares/notFound.middleware.ts
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
}