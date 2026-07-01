// ─────────────────────────────────────────────────────────────────────────────
// AUTH MODULE  ·  auth.routes.ts + auth.controller.ts + auth.service.ts
// Single file for brevity — split into 3 files in production
// ─────────────────────────────────────────────────────────────────────────────
import { Router, Request, Response, NextFunction } from "express";
import bcrypt  from "bcryptjs";
import jwt     from "jsonwebtoken";
import { z }   from "zod";
import { prisma }      from "../config/prisma";
import { redis }       from "../config/redis";
import { AppError }    from "../utils/AppError";
import { asyncHandler } from "../middlewares/async.middleware";
import { validate }    from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";
import { sendSMS }     from "../integrations/twilio";

const router = Router();

// ── Zod Schemas ───────────────────────────────────────────────────────────────
const RegisterSchema = z.object({
  name:     z.string().min(2).max(60),
  phone:    z.string().regex(/^\+91[6-9]\d{9}$/, "Invalid Indian mobile number"),
  email:    z.string().email().optional(),
  password: z.string().min(8).max(72),
});

const LoginSchema = z.object({
  phone:    z.string().regex(/^\+91[6-9]\d{9}$/),
  password: z.string().min(1),
});

const OtpRequestSchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/),
});

const OtpVerifySchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/),
  otp:   z.string().length(6),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function signTokens(userId: string, role: string) {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
  );
  const refreshToken = jwt.sign(
    { userId, role, type: "refresh" },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d" }
  );
  return { accessToken, refreshToken };
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 * Register with phone + password (OTP verification separate)
 */
router.post("/register", validate(RegisterSchema), asyncHandler(async (req: Request, res: Response) => {
  const { name, phone, email, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) throw new AppError("Phone number already registered", 409);

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      phone,
      email,
      password:    hashedPassword,
      role:        "customer",
      isVerified:  false,
      loyaltyPoints: 100, // welcome bonus
    },
    select: { id: true, name: true, phone: true, email: true, role: true },
  });

  // Send OTP for phone verification
  const otp = generateOTP();
  await redis.setex(`otp:${phone}`, 600, otp); // 10 min TTL
  await sendSMS(phone, `Your KhatuMart verification OTP is ${otp}. Valid for 10 minutes.`);

  res.status(201).json({
    success: true,
    message: "Registration successful. Please verify your phone number.",
    data:    { user },
  });
}));

/**
 * POST /api/v1/auth/login
 * Password-based login
 */
router.post("/login", validate(LoginSchema), asyncHandler(async (req: Request, res: Response) => {
  const { phone, password } = req.body;

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) throw new AppError("Invalid credentials", 401);
  if (user.status === "blocked") throw new AppError("Account has been blocked. Contact support.", 403);

  const isMatch = await bcrypt.compare(password, user.password!);
  if (!isMatch) throw new AppError("Invalid credentials", 401);

  const { accessToken, refreshToken } = signTokens(user.id, user.role);

  // Store refresh token in Redis
  await redis.setex(`refresh:${user.id}`, 30 * 24 * 60 * 60, refreshToken);

  // Update last login
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  res.json({
    success: true,
    data: {
      user:         { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    },
  });
}));

/**
 * POST /api/v1/auth/otp/request
 * Request OTP (for OTP-based login or verification)
 */
router.post("/otp/request", validate(OtpRequestSchema), asyncHandler(async (req: Request, res: Response) => {
  const { phone } = req.body;

  // Rate limit: max 3 OTP requests per 10 minutes per phone
  const attempts = await redis.incr(`otp_attempts:${phone}`);
  if (attempts === 1) await redis.expire(`otp_attempts:${phone}`, 600);
  if (attempts > 3)   throw new AppError("Too many OTP requests. Try again in 10 minutes.", 429);

  const otp = generateOTP();
  await redis.setex(`otp:${phone}`, 600, otp);
  await sendSMS(phone, `Your KhatuMart OTP is ${otp}. Do not share it with anyone.`);

  // Dev only: return OTP in response
  const data: Record<string, unknown> = { message: "OTP sent successfully" };
  if (process.env.NODE_ENV === "development") data.otp = otp;

  res.json({ success: true, data });
}));

/**
 * POST /api/v1/auth/otp/verify
 * Verify OTP and return tokens (OTP login flow)
 */
router.post("/otp/verify", validate(OtpVerifySchema), asyncHandler(async (req: Request, res: Response) => {
  const { phone, otp } = req.body;

  const storedOtp = await redis.get(`otp:${phone}`);
  if (!storedOtp || storedOtp !== otp) throw new AppError("Invalid or expired OTP", 400);

  // Delete OTP from Redis (one-time use)
  await redis.del(`otp:${phone}`);
  await redis.del(`otp_attempts:${phone}`);

  let user = await prisma.user.findUnique({ where: { phone } });

  // Auto-register if new user (phone-first onboarding)
  if (!user) {
    user = await prisma.user.create({
      data: { phone, role: "customer", isVerified: true, loyaltyPoints: 100, name: "New User" },
    });
  } else {
    await prisma.user.update({ where: { id: user.id }, data: { isVerified: true, lastLoginAt: new Date() } });
  }

  const { accessToken, refreshToken } = signTokens(user.id, user.role);
  await redis.setex(`refresh:${user.id}`, 30 * 24 * 60 * 60, refreshToken);

  res.json({
    success: true,
    data: {
      user:        { id: user.id, name: user.name, phone: user.phone, role: user.role },
      accessToken,
      refreshToken,
      isNewUser:   !user.name || user.name === "New User",
    },
  });
}));

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
router.post("/refresh", validate(RefreshSchema), asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  let decoded: { userId: string; role: string };
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as typeof decoded;
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const stored = await redis.get(`refresh:${decoded.userId}`);
  if (!stored || stored !== refreshToken) throw new AppError("Refresh token revoked", 401);

  const { accessToken, refreshToken: newRefreshToken } = signTokens(decoded.userId, decoded.role);
  await redis.setex(`refresh:${decoded.userId}`, 30 * 24 * 60 * 60, newRefreshToken);

  res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
}));

/**
 * POST /api/v1/auth/logout
 * Invalidate refresh token
 */
router.post("/logout", authenticate, asyncHandler(async (req: Request, res: Response) => {
  await redis.del(`refresh:${req.user!.userId}`);
  res.json({ success: true, message: "Logged out successfully" });
}));

/**
 * GET /api/v1/auth/me
 * Get current user profile
 */
router.get("/me", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where:  { id: req.user!.userId },
    select: {
      id: true, name: true, phone: true, email: true,
      role: true, isVerified: true, loyaltyPoints: true,
      loyaltyTier: true, createdAt: true, lastLoginAt: true,
    },
  });
  if (!user) throw new AppError("User not found", 404);
  res.json({ success: true, data: { user } });
}));

export default router;