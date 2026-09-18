// src/config/database.ts
//
// Replaces config/prisma.ts (never existed) — this is now the single
// Mongoose connection used across the app. Route files should
// `import { connectDatabase } from "../../config/database"` at boot and
// then pull models from `../../database/models/*` directly (Mongoose
// models are usable as soon as mongoose.connect() resolves).

import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

mongoose.set("strictQuery", true);

export async function connectDatabase(): Promise<typeof mongoose> {
  mongoose.connection.on("connected", () => logger.info("MongoDB connected"));
  mongoose.connection.on("error", (err) => logger.error("MongoDB connection error", { err }));
  mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));

  await mongoose.connect(env.MONGO_URI);
  return mongoose;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

export { mongoose };