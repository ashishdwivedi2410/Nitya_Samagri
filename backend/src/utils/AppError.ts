// src/utils/AppError.ts
export class AppError extends Error {
  public statusCode:    number;
  public isOperational: boolean;
  public errors?:       Array<{ field: string; message: string }>;

  constructor(message: string, statusCode = 500, errors?: Array<{ field: string; message: string }>) {
    super(message);
    this.statusCode    = statusCode;
    this.isOperational = true;
    this.errors        = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}