// src/utils/logger.ts
import winston from "winston";

export const logger = winston.createLogger({
  level:  process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === "production"
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize({ all: true }),
          winston.format.printf(({ timestamp, level, message, ...meta }) =>
            `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ""}`
          )
        )
  ),
  transports: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === "production"
      ? [
          new winston.transports.File({ filename: "logs/error.log",   level: "error", maxsize: 5242880, maxFiles: 5 }),
          new winston.transports.File({ filename: "logs/combined.log", maxsize: 5242880, maxFiles: 5 }),
        ]
      : []),
  ],
});