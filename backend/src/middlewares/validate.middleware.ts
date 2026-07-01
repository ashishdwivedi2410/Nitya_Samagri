// src/middlewares/validate.middleware.ts
import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AppError } from "../utils/AppError";

export function validate(
  schema: ZodSchema,
  source: "body" | "query" | "params" = "body"
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.errors.map(e => ({
        field:   e.path.join("."),
        message: e.message,
      }));
      return next(new AppError("Validation failed", 400, errors));
    }
    req[source] = result.data;
    next();
  };
}